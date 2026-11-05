import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { sendEmail } from "../utils/email.js";
import { orderConfirmationEmail, statusUpdateEmail } from "../utils/emailTemplates.js";

const router = express.Router();

// Send an email in the background. If it fails, log it but don't break the request.
const emailInBackground = (to, email) => {
  if (!email) return;
  sendEmail({ to, ...email }).catch((err) =>
    console.error(`Email to ${to} failed:`, err.message)
  );
};

// Email the customer when their order's status changes
const sendStatusEmail = async (order) => {
  const user = await User.findById(order.user).select("name email");
  if (user) emailInBackground(user.email, statusUpdateEmail(order, user));
};

// Put an order's items back into stock
const restoreStock = async (order) => {
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: item.quantity },
    });
  }
};

// Take an order's items out of stock again (returns an error message or null)
const reduceStock = async (order) => {
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (!product) return `A product in this order no longer exists`;
    if (product.countInStock < item.quantity) {
      return `Not enough stock for ${product.name}`;
    }
  }
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: -item.quantity },
    });
  }
  return null;
};

// Place an order (logged-in users)
router.post("/", protect, async (req, res) => {
  const { orderItems, shippingAddress } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: "No items in order" });
  }

  const { fullName, address, city, phone } = shippingAddress || {};
  if (!fullName || !address || !city || !phone) {
    return res.status(400).json({ message: "Please fill in the full shipping address" });
  }

  const items = [];
  let totalPrice = 0;

  for (const item of orderItems) {
    if (!mongoose.isValidObjectId(item.product)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    if (product.countInStock < quantity) {
      return res.status(400).json({ message: `Not enough stock for ${product.name}` });
    }

    items.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
    });
    totalPrice += product.price * quantity;
  }

  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: -item.quantity },
    });
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems: items,
    shippingAddress: { fullName, address, city, phone },
    totalPrice,
  });

  emailInBackground(req.user.email, orderConfirmationEmail(order, req.user));

  res.status(201).json(order);
});

// Get my orders (logged-in users)
router.get("/mine", protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// Get all orders (admin only)
router.get("/", protect, admin, async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// Get one order (its owner or an admin)
router.get("/:id", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isOwner = order.user?._id.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not allowed to view this order" });
  }

  res.json(order);
});

// Customer cancels their own pending order
router.put("/:id/cancel", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed to cancel this order" });
  }
  if (order.status !== "pending") {
    return res.status(400).json({ message: "Only pending orders can be cancelled" });
  }

  await restoreStock(order);
  order.status = "cancelled";
  await order.save();

  emailInBackground(req.user.email, statusUpdateEmail(order, req.user));

  res.json(order);
});

// Update order status (admin only)
router.put("/:id/status", protect, admin, async (req, res) => {
  const allowed = ["pending", "shipped", "delivered", "cancelled"];
  const newStatus = req.body.status;

  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const oldStatus = order.status;
  if (oldStatus === newStatus) return res.json(order);

  if (newStatus === "cancelled") {
    await restoreStock(order);
  }

  if (oldStatus === "cancelled") {
    const problem = await reduceStock(order);
    if (problem) return res.status(400).json({ message: problem });
  }

  order.status = newStatus;
  await order.save();

  await sendStatusEmail(order);

  res.json(order);
});

export default router;
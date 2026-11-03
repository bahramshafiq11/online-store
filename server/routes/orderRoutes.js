import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

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
      price: product.price, // real price from the database
      quantity,
    });
    totalPrice += product.price * quantity;
  }

  // Reduce stock for each product
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: -item.quantity },
    });
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems: items,
    shippingAddress,
    totalPrice,
  });

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

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not allowed to view this order" });
  }

  res.json(order);
});

// Update order status (admin only)
router.put("/:id/status", protect, admin, async (req, res) => {
  const allowed = ["pending", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { returnDocument: "after" }
  );
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

export default router;
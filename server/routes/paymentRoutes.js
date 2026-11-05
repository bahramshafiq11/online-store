import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  safepayConfigured,
  createTracker,
  checkoutUrl,
  fetchTrackerStatus,
  amountMatches,
} from "../utils/safepay.js";
import { sendEmailInBackground } from "../utils/email.js";
import { paymentReceivedEmail } from "../utils/emailTemplates.js";

const router = express.Router();

const CLIENT_URL = () => process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_URL = () => process.env.SERVER_URL || "http://localhost:5000";

// Tell the frontend whether online payment is available
router.get("/config", (req, res) => {
  res.json({ online: safepayConfigured() });
});

// Start an online payment for an order. Returns { url } to send the customer to.
router.post("/:orderId/start", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed to pay for this order" });
  }
  if (order.paymentMethod !== "Online Payment") {
    return res.status(400).json({ message: "This order is not set for online payment" });
  }
  if (order.isPaid) {
    return res.status(400).json({ message: "This order is already paid" });
  }
  if (order.status === "cancelled") {
    return res.status(400).json({ message: "This order was cancelled" });
  }
  if (!safepayConfigured()) {
    return res.status(503).json({ message: "Online payments aren't set up yet" });
  }

  let token;
  try {
    token = await createTracker(order.totalPrice);
  } catch (err) {
    console.error(err.message);
    return res.status(502).json({ message: "Could not reach the payment service. Try again." });
  }

  order.paymentResult = { tracker: token, reference: "" };
  await order.save();

  const url = checkoutUrl({
    token,
    orderId: order._id.toString(),
    redirectUrl: `${SERVER_URL()}/api/payments/safepay/return`,
    cancelUrl: `${CLIENT_URL()}/order/${order._id}?payment=cancelled`,
  });

  console.log("[payment] started for order", order._id.toString(), "tracker:", token);
  res.json({ url });
});

// Ask Safepay whether this order's payment went through (owner or admin)
router.post("/:orderId/verify", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not allowed to check this order" });
  }
  if (order.paymentMethod !== "Online Payment") {
    return res.status(400).json({ message: "This order is not an online payment" });
  }
  if (order.isPaid) {
    return res.json({ isPaid: true, paidAt: order.paidAt });
  }

  const tracker = order.paymentResult?.tracker;
  if (!tracker) {
    return res.json({ isPaid: false, state: "NOT_STARTED" });
  }
  if (!safepayConfigured()) {
    return res.status(503).json({ message: "Online payments aren't set up yet" });
  }

  let status;
  try {
    status = await fetchTrackerStatus(tracker);
  } catch (err) {
    console.error("[payment]", err.message);
    return res.status(502).json({ message: "Could not reach the payment service. Try again." });
  }

  console.log("[payment] status for order", order._id.toString(), status);

  if (status.state !== "TRACKER_ENDED") {
    return res.json({ isPaid: false, state: status.state });
  }

  if (!amountMatches(status.amount, order.totalPrice)) {
    console.error("[payment] amount mismatch", status.amount, "vs", order.totalPrice);
    return res.status(400).json({ message: "Payment amount doesn't match this order" });
  }
  if (status.currency && status.currency !== "PKR") {
    return res.status(400).json({ message: "Payment currency doesn't match this order" });
  }

  // Only mark paid once, even if two checks arrive at the same moment
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, isPaid: false },
    { isPaid: true, paidAt: new Date() },
    { returnDocument: "after" }
  );

  if (updated) {
    console.log("[payment] marked PAID:", order._id.toString());
    const user = await User.findById(order.user).select("name email");
    if (user) sendEmailInBackground(user.email, paymentReceivedEmail(updated, user));
  }

  const latest = updated || (await Order.findById(order._id));
  res.json({ isPaid: true, paidAt: latest.paidAt });
});

// If Safepay does send the customer back here, just forward them to their order page,
// which then checks the payment status with Safepay directly.
router.all("/safepay/return", (req, res) => {
  const orderId = req.query.order_id || req.body?.order_id;
  console.log("[payment] return hit for order", orderId);

  if (!mongoose.isValidObjectId(orderId)) {
    return res.redirect(`${CLIENT_URL()}/my-orders`);
  }
  res.redirect(`${CLIENT_URL()}/order/${orderId}?payment=check`);
});

export default router;
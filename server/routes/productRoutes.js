import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Makes user text safe to use inside a search pattern
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Recalculate the average rating and review count
const updateRating = (product) => {
  product.numReviews = product.reviews.length;
  product.rating =
    product.numReviews === 0
      ? 0
      : product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.numReviews;
};

// Get products, with optional ?search=, ?category=, ?page=, ?limit= (anyone)
router.get("/", async (req, res) => {
  const { search, category } = req.query;
  const filter = {};

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }
  if (category) {
    filter.category = category;
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 8));

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .select("-reviews")
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    products,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

// Get the list of categories (anyone)
// Must be above "/:id", or Express would treat "categories" as a product ID
router.get("/categories", async (req, res) => {
  const categories = await Product.distinct("category");
  res.json(categories.sort());
});

// Get one product, including its reviews (anyone)
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// Create a product (admin only)
router.post("/", protect, admin, async (req, res) => {
  // Ignore any review data sent by the browser
  const { reviews, rating, numReviews, ...data } = req.body;
  const product = await Product.create(data);
  res.status(201).json(product);
});

// Update a product (admin only)
router.put("/:id", protect, admin, async (req, res) => {
  const { reviews, rating, numReviews, ...data } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// Delete a product (admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
});

// Add a review (logged-in users who bought the product)
router.post("/:id/reviews", protect, async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = (req.body.comment || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  if (!comment) {
    return res.status(400).json({ message: "Please write a comment" });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const alreadyReviewed = product.reviews.some(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ message: "You have already reviewed this product" });
  }

  const hasBought = await Order.exists({
    user: req.user._id,
    "orderItems.product": product._id,
    status: { $ne: "cancelled" },
  });
  if (!hasBought) {
    return res.status(403).json({ message: "You can only review products you have bought" });
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
  });
  updateRating(product);
  await product.save();

  res.status(201).json(product);
});

// Delete a review (the reviewer or an admin)
router.delete("/:id/reviews/:reviewId", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const review = product.reviews.id(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Review not found" });

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not allowed to delete this review" });
  }

  product.reviews.pull(req.params.reviewId);
  updateRating(product);
  await product.save();

  res.json(product);
});

export default router;
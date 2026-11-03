import express from "express";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all products (anyone)
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get one product (anyone)
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// Create a product (admin only)
router.post("/", protect, admin, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// Update a product (admin only)
router.put("/:id", protect, admin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
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

export default router;
import express from "express";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Makes user text safe to use inside a search pattern
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get all products, with optional ?search= and ?category= (anyone)
router.get("/", async (req, res) => {
  const { search, category } = req.query;
  const filter = {};

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }
  if (category) {
    filter.category = category;
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

// Get the list of categories (anyone)
// Must be above "/:id", or Express would treat "categories" as a product ID
router.get("/categories", async (req, res) => {
  const categories = await Product.distinct("category");
  res.json(categories.sort());
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

export default router;
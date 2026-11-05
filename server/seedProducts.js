import "dotenv/config";
import mongoose from "mongoose";
import Product from "./models/Product.js";

const img = (text) => `https://placehold.co/400x300?text=${encodeURIComponent(text)}`;

const samples = [
  { name: "Smart Watch", description: "Fitness tracking, heart rate monitor and 7 day battery", price: 8500, category: "Electronics", countInStock: 12, image: img("Smart Watch") },
  { name: "Bluetooth Speaker", description: "Portable waterproof speaker with deep bass", price: 3800, category: "Electronics", countInStock: 20, image: img("Speaker") },
  { name: "USB-C Fast Charger", description: "25W fast charger compatible with most phones", price: 1800, category: "Electronics", countInStock: 40, image: img("Charger") },
  { name: "Denim Jacket", description: "Classic blue denim jacket, regular fit", price: 4500, category: "Clothing", countInStock: 15, image: img("Jacket") },
  { name: "Cotton Kurta", description: "Lightweight cotton kurta for everyday wear", price: 2800, category: "Clothing", countInStock: 30, image: img("Kurta") },
  { name: "Running Shoes", description: "Breathable running shoes with cushioned sole", price: 6200, category: "Sports", countInStock: 18, image: img("Shoes") },
  { name: "Yoga Mat", description: "Non-slip 6mm yoga mat with carry strap", price: 2200, category: "Sports", countInStock: 25, image: img("Yoga Mat") },
  { name: "Cricket Bat", description: "Kashmir willow bat for tape and tennis ball cricket", price: 5500, category: "Sports", countInStock: 8, image: img("Cricket Bat") },
  { name: "Ceramic Mug Set", description: "Set of 4 ceramic mugs, dishwasher safe", price: 1600, category: "Home", countInStock: 22, image: img("Mugs") },
  { name: "Table Lamp", description: "Warm LED desk lamp with adjustable arm", price: 3200, category: "Home", countInStock: 10, image: img("Lamp") },
  { name: "Notebook Pack", description: "Pack of 5 ruled notebooks, 100 pages each", price: 900, category: "Books", countInStock: 50, image: img("Notebooks") },
  { name: "JavaScript Guide Book", description: "Beginner friendly guide to modern JavaScript", price: 2400, category: "Books", countInStock: 14, image: img("JS Book") },
];

const remove = process.argv.includes("--remove");

await mongoose.connect(process.env.MONGO_URI);

if (remove) {
  const result = await Product.deleteMany({ name: { $in: samples.map((p) => p.name) } });
  console.log(`Removed ${result.deletedCount} sample products`);
} else {
  let added = 0;
  for (const p of samples) {
    const exists = await Product.exists({ name: p.name });
    if (!exists) {
      await Product.create(p);
      added++;
    }
  }
  console.log(`Added ${added} sample products (${samples.length - added} already existed)`);
}

await mongoose.disconnect();
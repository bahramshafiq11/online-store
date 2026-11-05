import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { protect, admin } from "../middleware/authMiddleware.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Keep the file in memory (not on disk), max 5 MB, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      const err = new Error("Only image files are allowed");
      err.status = 400;
      cb(err);
    }
  },
});

// Send the image to Cloudinary and wait for the result
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "mystore" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const router = express.Router();

// Upload one image (admin only). Returns { url }
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const result = await uploadToCloudinary(req.file.buffer);
  res.status(201).json({ url: result.secure_url });
});

export default router;
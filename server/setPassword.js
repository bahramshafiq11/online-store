import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const [email, password] = process.argv.slice(2);

if (!email || !password || password.length < 8) {
  console.log("Usage: node setPassword.js you@example.com NewPassword123");
  console.log("Password must be at least 8 characters.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  console.log("No user found with that email");
} else {
  user.password = password; // hashed automatically before saving
  await user.save();
  console.log(`Password updated for ${user.email}`);
}

await mongoose.disconnect();
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.log("Usage: node makeAdmin.js you@example.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { isAdmin: true },
  { new: true }
);

console.log(user ? `${user.email} is now an admin` : "No user found with that email");
await mongoose.disconnect();
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });


import User from "./models/User.js";

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected Successfully");

    // Check if admin already exists
    let admin = await User.findOne({ email: "admin@greennest.com" });
    
    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin@123", 10);
      admin = new User({
        name: "Admin",
        email: "admin@greennest.com",
        password: hashedPassword,
        role: "admin",
        phone: "0000000000",
        address: "GreenNest Admin"
      });
      await admin.save();
      console.log("Admin user created: admin@greennest.com / admin@123");
    } else {
      console.log("Admin user already exists");
      if (admin.role !== "admin") {
        admin.role = "admin";
        await admin.save();
        console.log("Updated existing user to admin");
      }
    }

    await mongoose.connection.close();
    console.log("Script completed");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

createAdminUser();

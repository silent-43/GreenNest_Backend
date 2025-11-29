import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  role: { type: String, default: "user", enum: ["user", "admin"] },
  otp: { type: String },
  otpExpire: { type: Date },
  cart: [
    {
      productId: String,
      name: String,
      price: Number,
      image: String,
      quantity: { type: Number, default: 1 }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);

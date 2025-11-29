import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, default: "" },
  stock: { type: Number, default: 10 },
  careInstructions: { type: String, default: "" },
  sunlight: { type: String, default: "" },
  wateringFrequency: { type: String, default: "" },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);

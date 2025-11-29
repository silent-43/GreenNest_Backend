import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String,
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
  paymentMethod: { type: String, default: "SSLCommerz" },
  transactionId: { type: String, default: "" },
  shippingAddress: { type: String, default: "" },
  shippingPhone: { type: String, default: "" },
  orderNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);

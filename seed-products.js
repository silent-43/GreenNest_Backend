import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "./models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Sample products
    const products = [
      {
        name: "Snake Plant",
        description: "A low-maintenance indoor plant that purifies air",
        price: 500,
        category: "Indoor Plants",
        stock: 15,
        careInstructions: "Water every 2-3 weeks, prefers indirect light",
        sunlight: "Low to Medium",
        wateringFrequency: "Every 2-3 weeks",
        difficulty: "Easy",
      },
      {
        name: "Monstera Deliciosa",
        description: "Popular climbing plant with split leaves",
        price: 800,
        category: "Indoor Plants",
        stock: 10,
        careInstructions: "Water weekly, needs bright indirect light",
        sunlight: "Bright Indirect",
        wateringFrequency: "Weekly",
        difficulty: "Easy",
      },
      {
        name: "Pothos",
        description: "Trailing vine plant, perfect for hanging baskets",
        price: 400,
        category: "Indoor Plants",
        stock: 20,
        careInstructions: "Water when soil is dry, very adaptable",
        sunlight: "Low to Bright",
        wateringFrequency: "Every 1-2 weeks",
        difficulty: "Easy",
      },
      {
        name: "Tomato Plant",
        description: "Fresh tomato plants for home gardening",
        price: 300,
        category: "Vegetables",
        stock: 12,
        careInstructions: "Full sun, regular watering, fertilize monthly",
        sunlight: "Full Sun",
        wateringFrequency: "Daily",
        difficulty: "Medium",
      },
      {
        name: "Basil Herb",
        description: "Fresh basil for cooking",
        price: 250,
        category: "Herbs",
        stock: 18,
        careInstructions: "Keep moist, pinch off flowers to promote growth",
        sunlight: "Bright",
        wateringFrequency: "2-3 times weekly",
        difficulty: "Easy",
      },
      {
        name: "Rose Plant",
        description: "Beautiful flowering rose plant",
        price: 600,
        category: "Flowers",
        stock: 8,
        careInstructions: "Full sun, water at base, prune regularly",
        sunlight: "Full Sun",
        wateringFrequency: "Every 2 days",
        difficulty: "Hard",
      },
      {
        name: "Dracaena",
        description: "Easy to grow houseplant with colorful leaves",
        price: 450,
        category: "Indoor Plants",
        stock: 14,
        careInstructions: "Indirect light, water every 10 days",
        sunlight: "Medium",
        wateringFrequency: "Every 10 days",
        difficulty: "Easy",
      },
      {
        name: "Ficus Tree",
        description: "Indoor fig tree with glossy leaves",
        price: 1200,
        category: "Indoor Plants",
        stock: 5,
        careInstructions: "Bright indirect light, consistent watering",
        sunlight: "Bright Indirect",
        wateringFrequency: "Weekly",
        difficulty: "Medium",
      },
    ];

    await Product.insertMany(products);
    console.log("✅ Sample products inserted successfully");

    await mongoose.connection.close();
    console.log("✅ Script completed");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

seedProducts();

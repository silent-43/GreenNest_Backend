//import all necessary...................................................................
import User from "./models/User.js";
import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import axios from "axios";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";


dotenv.config();










import myFunction from "../dist/myFunction.js"; // adjust path

export default async function handler(req, res) {
  try {
    // Example: handle GET request
    if (req.method === "GET") {
      const result = await myFunction(); // call your backend logic
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Serverless function error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}








// ENV & PATH SETUP ..............................
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
console.log("ENV FILE LOADED: MONGO_URI =", process.env.MONGO_URI);

const app = express();
app.use(bodyParser.json());






// MIDDLEWARE...............................................................
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000, sameSite: "lax", httpOnly: true },
  })
);

// AUTH MIDDLEWARE
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) next();
  else res.status(403).json({ loggedIn: false, message: "Access denied. Please log in." });
};






// DATABASE CONNECTION...........................................................
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));






// Story Schema.............................................................................
const storySchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  story: { type: String, default: "" },
  voiceUrl: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});
const Story = mongoose.model("Story", storySchema);





// CART SESSION SETUP...............................................................................
app.use((req, res, next) => {
  if (!req.session.cart) req.session.cart = [];
  next();
});





// FILE UPLOAD CONFIG..............................................................................
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });














// ROUTES................ALL.....................................................................................
app.use("/api/auth", authRoutes);
app.use(
  cors({
    origin: ["http://127.0.0.1:8080", "http://localhost:8080", "http://127.0.0.1:5500"],
    credentials: true,
  })
);


app.get("/", (req, res) => {
  res.send("🌿 GreenNest backend connected successfully!");
});

// AUTH ROUTES
app.get("/check-session", (req, res) => {
  if (req.session && req.session.user) return res.json({ loggedIn: true, user: req.session.user });
  res.status(401).json({ loggedIn: false });
});




// PROFILE ROUTES
app.get("/get-profile", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  if (!user) return res.json({ success: false, message: "User not found" });
  res.json({ success: true, profile: user });
});

app.post("/update-profile", isLoggedIn, upload.single("profilePic"), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const profilePicPath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const updateFields = { name, email, phone, address };
    if (profilePicPath) updateFields.profilePic = profilePicPath;
    const user = await User.findByIdAndUpdate(req.session.user.id, updateFields, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Serve uploads
app.use("/uploads", express.static(uploadDir));


// STORY ROUTES 
app.post("/share-story", upload.single("voice"), async (req, res) => {
  try {
    const { name, story } = req.body;
    if (!name && !story && !req.file)
      return res.status(400).json({ success: false, message: "Need a name, story, or voice message." });

    const voiceUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const newStory = new Story({ name: name || "Anonymous", story: story || "", voiceUrl });
    await newStory.save();
    res.json({ success: true, message: "Story shared successfully!" });
  } catch (err) {
    console.error("SHARE STORY ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to share story: " + err.message });
  }
});

app.get("/get-stories", async (req, res) => {
  try {
    const stories = await Story.find().sort({ date: -1 });
    res.json({ success: true, stories });
  } catch (err) {
    console.error("GET STORIES ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stories: " + err.message });
  }
});




// CART ROUTES
// Add to Cart
app.post("/add-to-cart", isLoggedIn, async (req, res) => {
  try {
    let { productId, name, price, image } = req.body;
    // Ensure productId is string for consistent comparison
    productId = String(productId);
    console.log(`Adding to cart: productId=${productId}, name=${name}, price=${price}`);
    
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const existingItem = user.cart.find(item => String(item.productId) === productId);
    if (existingItem) {
      console.log(`  ↑ Item already exists. Incrementing quantity from ${existingItem.quantity} to ${existingItem.quantity + 1}`);
      existingItem.quantity += 1; // if duplicata then increase quantity
    } else {
      console.log(`  New item added to cart`);
      user.cart.push({ productId, name, price, image, quantity: 1 });
    }

    console.log(`Cart now has ${user.cart.length} items`);
    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Cart
app.get("/get-cart", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Filter out invalid items (with undefined or null productId)
    const validCart = user.cart.filter(item => item.productId && String(item.productId).trim() !== "");
    
    // If invalid items were found, update the database
    if (validCart.length !== user.cart.length) {
      console.log(`🧹 Cleaning cart: removed ${user.cart.length - validCart.length} invalid items`);
      user.cart = validCart;
      await user.save();
    }

    console.log(`User ${user.email}: Cart has ${validCart.length} items`);
    validCart.forEach((item, idx) => {
      console.log(`   Item ${idx}: ${item.name} (productId: ${item.productId})`);
    });

    res.json({ success: true, cart: validCart });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// Remove from Cart
app.post("/remove-from-cart", isLoggedIn, async (req, res) => {
  try {
    let { productId } = req.body;
    // Ensure productId is string for consistent comparison
    productId = String(productId);
    console.log(`Removing from cart: productId=${productId}`);
    
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ success: false });

    const beforeLength = user.cart.length;
    user.cart = user.cart.filter(item => String(item.productId) !== productId);
    const afterLength = user.cart.length;
    
    console.log(`  Cart items: ${beforeLength} → ${afterLength}`);
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error("REMOVE FROM CART ERROR:", err);
    res.status(500).json({ success: false });
  }
});



// Checkout - Create Order
app.post("/checkout", isLoggedIn, async (req, res) => {
  try {
    const { shippingAddress, shippingPhone, orderNotes } = req.body || {};
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ success: false });

    if (user.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let totalAmount = 0;
    user.cart.forEach(item => {
      totalAmount += item.price * item.quantity;
    });

    const order = new Order({
      userId: user._id,
      items: user.cart,
      totalAmount,
      shippingAddress: shippingAddress || user.address || "Not provided",
      shippingPhone: shippingPhone || user.phone || "Not provided",
      orderNotes: orderNotes || "",
      status: "pending"
    });

    await order.save();
    user.cart = [];
    await user.save();

    res.json({ success: true, message: "Order created successfully", orderId: order._id, totalAmount });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// PRODUCT ROUTES
// Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get single product
app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add product (admin only)
app.post("/add-product", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can add products" });
    }

    const { name, description, price, category, stock, careInstructions, sunlight, wateringFrequency, difficulty } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, price, and category are required" });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      stock: stock || 10,
      careInstructions,
      sunlight,
      wateringFrequency,
      difficulty
    });

    await product.save();
    res.json({ success: true, message: "Product added successfully", product });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update product (admin only)
app.post("/update-product/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can update products" });
    }

    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    res.json({ success: true, message: "Product updated", product });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete product (admin only)
app.post("/delete-product/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can delete products" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ADMIN ROUTES
// Get all users (admin only)
app.get("/get-users", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can access this" });
    }

    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete user (admin only)
app.delete("/delete-user/:userId", isLoggedIn, async (req, res) => {
  try {
    const admin = await User.findById(req.session.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can delete users" });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all orders (admin only)
app.get("/get-orders", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can access this" });
    }

    const orders = await Order.find().populate("userId", "name email phone").lean();
    console.log("Fetched orders:", orders.length);
    if (orders.length > 0) {
      console.log("First order:", JSON.stringify(orders[0], null, 2));
    }
    res.json({ success: true, orders });
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get user orders
app.get("/get-my-orders", isLoggedIn, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.user.id });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update order status (admin only)
app.post("/update-order-status/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can update orders" });
    }

    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    
    res.json({ success: true, message: "Order status updated", order });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get dashboard stats (admin only)
app.get("/admin-stats", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can access this" });
    }

    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name email");

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




// PAYMENT ROUTES (SSLCommerz)
// Initiate Payment
app.post("/payment-request", isLoggedIn, async (req, res) => {
  try {
    const { orderId, totalAmount, shippingAddress, shippingPhone, orderNotes } = req.body;
    const user = await User.findById(req.session.user.id);
    if (!user || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Create order first
    const order = new Order({
      userId: user._id,
      items: user.cart,
      totalAmount: totalAmount || user.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      shippingAddress: shippingAddress || user.address || "Not provided",
      shippingPhone: shippingPhone || user.phone || "Not provided",
      orderNotes: orderNotes || "",
      status: "pending",
      paymentMethod: "SSLCommerz"
    });

    await order.save();

    // SSLCommerz payment parameters
    const paymentData = {
      store_id: process.env.SSL_STORE_ID || "test",
      store_passwd: process.env.SSL_STORE_PASSWORD || "test",
      total_amount: order.totalAmount,
      currency: "BDT",
      tran_id: `GN-${order._id}`,
      success_url: `${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}/payment-success.html`,
      fail_url: `${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}/payment-fail.html`,
      cancel_url: `${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}/payment-cancel.html`,
      ipn_url: `http://localhost:${process.env.PORT || 5000}/payment-ipn`,
      cus_name: user.name,
      cus_email: user.email,
      cus_phone: user.phone || "N/A",
      cus_add1: user.address || "N/A",
      product_name: order.items.map(i => i.name).join(", "),
      product_category: "Plants",
      product_profile: "physical-goods"
    };

    // Send to SSLCommerz
    const sslResponse = await axios.post("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", paymentData);

    if (sslResponse.data.status === "success") {
      res.json({
        success: true,
        gatewayURL: sslResponse.data.GatewayPageURL,
        orderId: order._id
      });
    } else {
      res.status(400).json({ success: false, message: "Failed to initialize payment" });
    }
  } catch (err) {
    console.error("PAYMENT REQUEST ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Payment IPN (Instant Payment Notification)
app.post("/payment-ipn", async (req, res) => {
  try {
    const { tran_id, status, val_id } = req.body;

    if (!tran_id) return res.status(400).json({ success: false });

    const orderId = tran_id.replace("GN-", "");
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false });

    if (status === "VALID") {
      order.status = "paid";
      order.transactionId = val_id;
    } else if (status === "FAILED") {
      order.status = "cancelled";
    }

    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error("PAYMENT IPN ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// Verify Payment
app.get("/verify-payment/:orderId", isLoggedIn, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({
      success: true,
      order,
      isPaid: order.status === "paid"
    });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



















// Signup.................................................................................................
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role Selection in Frontend
    const userRole = (role === "admin" || role === "user") ? role : "user";
    await User.create({ name, email, password: hashedPassword, role: userRole });
    res.json({ success: true, message: "Registered successfully!" });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});






// Login................................................................................................
app.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log(`LOGIN ATTEMPT: email=${email}, role=${role}`);
    
    // Role parameter MUST be provided
    if (!role || !email || !password) {
      return res.status(400).json({ success: false, message: "Email, password, and role are required" });
    }

    // Only allow 'user' or 'admin' role
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ success: false, message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`LOGIN FAILED: user not found for email=${email}`);
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`LOGIN FAILED: invalid password for email=${email}`);
      return res.status(401).json({ success: false, message: "Invalid password" });
    }


    // STRICT: User role must exactly match selected role
    // Admin trying to login with "user" role will be denied
    // User trying to login with "admin" role will be denied
    if (user.role !== role) {
      return res.status(403).json({ success: false, message: "Access denied. Your account is registered as '" + user.role + "', but you selected '" + role + "' login type" });
    }

    req.session.user = { id: user._id, email: user.email, name: user.name, role: user.role };
    res.json({ success: true, message: "Login successful!", role: user.role, user: req.session.user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});





// Logout....................................................................................................
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully" });
  });
});






// FORGOT PASSWORD / OTP............................................................................................
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 6-digit OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 min expiry
    await user.save();

    // Gmail transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    let mailOptions = {
      from: `"GreenNest 🌿" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "GreenNest Password Reset OTP",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "OTP sent! Check your Gmail inbox." });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// RESET PASSWORD
app.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp != otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (user.otpExpire < Date.now()) return res.status(400).json({ success: false, message: "OTP expired" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful!" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});













// ADMIN MANAGEMENT............................................................................................
// Create new admin (admin only)
app.post("/create-admin", isLoggedIn, async (req, res) => {
  try {
    const requesterUser = await User.findById(req.session.user.id);
    if (!requesterUser || requesterUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can create new admins" });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      phone: "",
      address: ""
    });

    await newAdmin.save();
    res.json({ success: true, message: "New admin created successfully", admin: { name, email, id: newAdmin._id } });
  } catch (err) {
    console.error("CREATE ADMIN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});







// START SERVER....................................................................................................
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



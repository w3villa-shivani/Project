//server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cron from "node-cron";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import User from "./models/user.js";

dotenv.config();
connectDB();

const app = express();   // ✅ APP MUST BE CREATED BEFORE USE

// Get frontend URLs from environment or use defaults
const getCorsOrigin = () => {
  // Support multiple frontend URLs (comma-separated in env var)
  const envOrigins = process.env.FRONTEND_URL?.split(",").map(url => url.trim()) || [];
  
  // Default origins for development and production
  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000", 
    "https://project-git-main-shivanisingh-w3villas-projects.vercel.app",
    "https://project-8iej.onrender.com"
  ];
  
  // Combine env origins with defaults
  const allOrigins = [...new Set([...envOrigins, ...defaultOrigins])];
  
  console.log("CORS allowed origins:", allOrigins);
  return allOrigins;
};

app.use(
  cors({
    origin: getCorsOrigin(),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());

// Session configuration for Passport OAuth
app.use(session({
  secret: process.env.JWT_SECRET || "session_secret",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint - useful for keeping serverless functions warm
app.get("/health", (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const version = process.env.npm_package_version || 'unknown';
    
    // Optional token info (no fail)
    const userId = req.headers.authorization?.startsWith('Bearer ') 
      ? 'present' 
      : 'missing';
      
    res.status(200).json({ 
      status: "ok", 
      dbStatus,
      version,
      userId,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime())
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Health check failed" });
  }
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);  // ✅ AFTER app is declared
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);

app.use("/uploads", express.static("uploads"));

// Cron job to check and expire plans every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredUsers = await User.updateMany(
      {
        planExpiration: { $lt: now },
        planStatus: "active",
        plan: { $ne: "free" }, // Free plans don't expire
      },
      { planStatus: "expired" }
    );

    if (expiredUsers.modifiedCount > 0) {
      console.log(`Expired ${expiredUsers.modifiedCount} user plans`);
    }
  } catch (error) {
    console.error("Error in plan expiration cron job:", error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
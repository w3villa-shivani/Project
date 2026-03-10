//server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cron from "node-cron";

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

app.use(
  cors({
    origin: [
      "http://localhost:5173", // local development
      "https://your-vercel-app.vercel.app" // production frontend
    ],
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
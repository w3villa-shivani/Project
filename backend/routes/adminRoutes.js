// filepath: backend/routes/adminRoutes.js
import express from "express";
import User from "../models/user.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

// apply authentication and admin authorization to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all users with plan information (admin only)
// supports search, filter (plan/status) and pagination via query params
router.get("/users", async (req, res) => {
  try {
    const { search, plan, status, role, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (plan) filter.plan = plan;
    if (status) filter.planStatus = status;
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter, "name email plan planExpiration planStatus createdAt role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    // Check for expired plans
    const now = new Date();
    const updatedUsers = users.map(user => {
      let remainingTime = 0;
      
      if (user.planExpiration && new Date(user.planExpiration) < now && user.plan !== "free") {
        // Plan has expired, reset to free
        user.plan = "free";
        user.planExpiration = null;
        user.planStatus = "active";
        user.save();
      } else if (user.planExpiration && user.plan !== "free") {
        // Calculate remaining time in milliseconds
        remainingTime = user.planExpiration.getTime() - now.getTime();
      }
      
      return {
        ...user.toObject(),
        remainingTime: remainingTime > 0 ? remainingTime : 0
      };
    });

    res.json({ users: updatedUsers, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user plan (admin only)
router.put("/user/:userId/plan", async (req, res) => {
  try {
    const { plan, planExpiration } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        plan,
        planExpiration: planExpiration ? new Date(planExpiration) : null,
        planStatus: "active",
      },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// change user role (admin only)
router.put("/user/:userId/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user","admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
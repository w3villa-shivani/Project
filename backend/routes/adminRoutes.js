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
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name email plan planExpiration planStatus createdAt role",
    ).sort({ createdAt: -1 });

    const now = new Date();
    const updatedUsers = users.map((user) => {
      let remainingTime = 0;

      if (
        user.planExpiration &&
        new Date(user.planExpiration) >= now &&
        user.plan !== "free"
      ) {
        remainingTime = user.planExpiration.getTime() - now.getTime();
      }

      return {
        ...user.toObject(),
        remainingTime: remainingTime > 0 ? remainingTime : 0,
      };
    });

    res.json({
      users: updatedUsers,
      total: updatedUsers.length,
    });
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

// DELETE user profile (admin only) - cannot delete admins
router.delete("/user/:userId", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (targetUser.role === "admin") {
      return res.status(400).json({ error: "Cannot delete admin profiles" });
    }
    if (targetUser.isDeleted) {
      return res.status(400).json({ error: "User already deleted" });
    }

    // Soft delete
    targetUser.isDeleted = true;
    targetUser.OAuthTokens = {};
    targetUser.profileImage = null;
    targetUser.plan = "free";
    targetUser.planExpiration = null;
    await targetUser.save();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

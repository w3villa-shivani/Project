// filepath: backend/routes/paymentRoutes.js
import express from "express";
import User from "../models/user.js";

const router = express.Router();

// Pricing plans configuration (all free for now)
const PLANS = {
  free: { name: "Free", price: 0, duration: null },
  silver: { name: "Silver", price: 0, duration: 1 * 60 * 60 * 1000 },
  gold: { name: "Gold", price: 0, duration: 6 * 60 * 60 * 1000 },
};

// Activate a plan (free for now)
router.post("/activate-plan", async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!PLANS[planId]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const plan = PLANS[planId];
    const expiration = plan.duration ? new Date(Date.now() + plan.duration) : null;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: planId,
        planExpiration: expiration,
        planStatus: "active",
      },
      { returnDocument: "after" }
    );

    res.json({
      success: true,
      message: `${plan.name} plan activated`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Plan activation error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user's plan status
router.get("/plan-status/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "plan planExpiration planStatus"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    let remainingTime = 0;
    let shouldResetToFree = false;

    // Check if plan has expired
    if (user.planExpiration && now > user.planExpiration) {
      // Plan has expired, reset to free
      user.plan = "free";
      user.planExpiration = null;
      user.planStatus = "active";
      shouldResetToFree = true;
      await user.save();
    } else if (user.planExpiration && user.plan !== "free") {
      // Calculate remaining time in milliseconds
      remainingTime = user.planExpiration.getTime() - now.getTime();
    }

    res.json({
      plan: user.plan,
      expiration: user.planExpiration,
      status: user.planStatus,
      remainingTime: remainingTime > 0 ? remainingTime : 0,
      isExpired: shouldResetToFree,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;


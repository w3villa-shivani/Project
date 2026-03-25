// filepath: backend/routes/paymentRoutes.js
import express from "express";
import stripe from "stripe";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/user.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Pricing plans configuration (all free for now)
const PLANS = {
  free: { name: "Free", price: 0, duration: null },
  silver: { name: "Silver", price: 499, duration: 1 * 60 * 60 * 1000 }, // $4.99
  gold: { name: "Gold", price: 999, duration: 6 * 60 * 60 * 1000 }, // $9.99
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

// Create Stripe checkout session
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id; // From JWT

    if (!PLANS[planId]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const plan = PLANS[planId];
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan (${plan.duration ? "1 Hour" : "Unlimited"})`,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment?cancelled=true`,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Stripe webhook for payment confirmation
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;

    if (userId && planId && PLANS[planId]) {
      const plan = PLANS[planId];
      const expiration = plan.duration ? new Date(Date.now() + plan.duration) : null;

      await User.findByIdAndUpdate(
        userId,
        {
          plan: planId,
          planExpiration: expiration,
          planStatus: "active",
        }
      );
      console.log(`Plan ${planId} activated for user ${userId}`);
    }
  }

  res.json({ received: true });
});

// Payment success confirmation (optional)
router.get("/success", async (req, res) => {
  res.json({ success: true, message: "Payment successful! Plan activated." });
});

export default router;


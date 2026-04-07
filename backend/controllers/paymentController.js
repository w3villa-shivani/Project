// filepath: backend/controllers/paymentController.js
import Stripe from "stripe";
import User from "../models/user.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing plans configuration
export const PLANS = {
  free: { 
    name: "Free", 
    price: 0, 
    duration: null,
    stripePriceId: null 
  },
  silver: { 
    name: "Silver", 
    price: 999, // $9.99 in cents
    duration: 1 * 60 * 60 * 1000, // 1 hour
    stripePriceId: process.env.STRIPE_PRICE_ID_SILVER || "price_silver_test"
  },
  gold: { 
    name: "Gold", 
    price: 1999, // $19.99 in cents
    duration: 6 * 60 * 60 * 1000, // 6 hours
    stripePriceId: process.env.STRIPE_PRICE_ID_GOLD || "price_gold_test"
  },
};

/**
 * Create a checkout session for Stripe payment
 * POST /payment/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId, userId } = req.body;

    if (!planId || !userId) {
      return res.status(400).json({ 
        error: "Missing planId or userId" 
      });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ 
        error: "Invalid plan" 
      });
    }

    // Free plan doesn't require payment
    if (planId === "free") {
      return res.status(400).json({ 
        error: "Free plan cannot be purchased through Stripe" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      client_reference_id: userId,
      customer_email: user.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.BASE_URL}/payment/success?sessionId={CHECKOUT_SESSION_ID}&planId=${planId}`,
      cancel_url: `${process.env.BASE_URL}/payment/cancel`,
      metadata: {
        userId,
        planId,
      },
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to create checkout session" 
    });
  }
};

/**
 * Handle Stripe webhook events
 * POST /payment/webhook
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

/**
 * Handle successful checkout session
 */
const handleCheckoutSessionCompleted = async (session) => {
  const userId = session.metadata.userId;
  const planId = session.metadata.planId;

  if (!userId || !planId) {
    console.error("Missing userId or planId in session metadata");
    return;
  }

  const plan = PLANS[planId];
  if (!plan) {
    console.error(`Invalid plan: ${planId}`);
    return;
  }

  // Calculate plan expiration
  const expiration = plan.duration 
    ? new Date(Date.now() + plan.duration) 
    : null;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: planId,
        planExpiration: expiration,
        planStatus: "active",
      },
      { returnDocument: "after" }
    );

    console.log(`Plan ${planId} activated for user ${userId}`);
    console.log(`Plan expires at: ${expiration}`);

    // Could send confirmation email here
  } catch (error) {
    console.error("Error updating user plan:", error);
  }
};

/**
 * Handle successful payment intent
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  // Additional logging or tracking can be done here
};

/**
 * Handle refunded charge
 */
const handleChargeRefunded = async (charge) => {
  console.log(`Charge refunded: ${charge.id}`);
  // Could downgrade user plan or handle refund logic here
};

/**
 * Retrieve checkout session status
 * GET /payment/checkout-session/:sessionId
 */
export const getCheckoutSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: true,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerId: session.customer_details?.email,
      planId: session.metadata?.planId,
      userId: session.metadata?.userId,
    });
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    res.status(500).json({ 
      error: error.message || "Failed to retrieve session" 
    });
  }
};

/**
 * Activate free plan (no payment required)
 * POST /payment/activate-free
 */
export const activateFreePlan = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: "Missing userId" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: "free",
        planExpiration: null,
        planStatus: "active",
      },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    res.json({
      success: true,
      message: "Free plan activated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Plan activation error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to activate plan" 
    });
  }
};

/**
 * Get current user's plan status
 * GET /payment/plan-status/:userId
 */
export const getPlanStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "plan planExpiration planStatus"
    );

    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    const now = new Date();
    let remainingTime = 0;
    let isExpired = false;

    // Check if plan has expired
    if (user.planExpiration && now > user.planExpiration) {
      // Plan has expired, mark as expired
      user.plan = "free";
      user.planExpiration = null;
      user.planStatus = "expired";
      isExpired = true;
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
      isExpired: isExpired,
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message || "Failed to fetch plan status" 
    });
  }
};

/**
 * Get available plans
 * GET /payment/plans
 */
export const getPlans = async (req, res) => {
  try {
    const plansData = Object.entries(PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.price / 100, // Convert cents to dollars
      displayPrice: plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`,
      duration: plan.duration ? `${plan.duration / (60 * 60 * 1000)} hours` : "Unlimited",
      stripePriceId: plan.stripePriceId,
    }));

    res.json({
      success: true,
      plans: plansData,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message || "Failed to fetch plans" 
    });
  }
};

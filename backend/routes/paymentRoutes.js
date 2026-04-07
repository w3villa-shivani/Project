// filepath: backend/routes/paymentRoutes.js
import express from "express";
import bodyParser from "body-parser";
import {
  createCheckoutSession,
  handleWebhook,
  getCheckoutSessionStatus,
  activateFreePlan,
  getPlanStatus,
  getPlans,
} from "../controllers/paymentController.js";

const router = express.Router();

// Webhook route - needs raw body for Stripe signature verification
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleWebhook
);

// Create checkout session for payment
router.post("/create-checkout-session", createCheckoutSession);

// Retrieve checkout session status
router.get("/checkout-session/:sessionId", getCheckoutSessionStatus);

// Activate free plan (no payment required)
router.post("/activate-free", activateFreePlan);

// Get current user's plan status
router.get("/plan-status/:userId", getPlanStatus);

// Get available plans
router.get("/plans", getPlans);

// Legacy endpoint for backward compatibility
router.post("/activate-plan", activateFreePlan);

export default router;


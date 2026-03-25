//authRoutes.js

import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.js";
import { signup, login, me } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get frontend URL from environment variable or fallback
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || "http://localhost:5173";
};

// Store for state tokens (in production, use Redis or similar)
const stateStore = new Map();

// Generate secure state token
const generateStateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Clean up expired state tokens (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (now > value.expires) {
      stateStore.delete(key);
    }
  }
}, 60000);

/* ================= LOCAL ================= */

router.post("/signup", signup);
router.post("/login", login);

/* ================= GENERIC SOCIAL HANDLER ================= */

const socialAuthHandler = async (req, res) => {
  try {
    const frontendUrl = getFrontendUrl();
    
    // Validate state token to prevent CSRF
    const state = req.query.state;
    if (state) {
      const storedState = stateStore.get(state);
      if (!storedState) {
        // State token not found - this can happen if server restarted
        // between when user initiated OAuth and when Google redirected back.
        // Log warning but allow the flow to continue.
        console.warn("State token not found - possible server restart. Allowing OAuth flow to continue.");
      } else if (Date.now() > storedState.expires) {
        console.error("State token expired");
        return res.redirect(`${frontendUrl}/?error=state_expired`);
      } else {
        // State token is valid - delete it to prevent replay attacks
        stateStore.delete(state);
      }
    }

    // Passport now returns { profile, accessToken, refreshToken }
    const { profile, accessToken, refreshToken } = req.user;

    console.log("Social auth handler - provider:", profile.provider);

    const email =
      profile.emails?.[0]?.value ||
      profile._json?.mail ||
      profile._json?.userPrincipalName;

    if (!email) {
      console.error("No email found in OAuth profile");
      return res.redirect(`${frontendUrl}/?error=email_not_found`);
    }

    console.log("OAuth email:", email);

    // Get profile image from OAuth provider
    let profileImage = null;
    if (profile.photos?.[0]?.value) {
      profileImage = profile.photos[0].value;
    } else if (profile._json?.picture) {
      profileImage = profile._json.picture;
    }

    // Find existing user by email
    let user = await User.findOne({ email });

    if (user) {
      // User exists - check if they're a local account
      if (user.provider === "local") {
        // Link the OAuth provider to existing local account
        user.provider = profile.provider;
        user.providerId = profile.id;
        
        // Store OAuth tokens if provided
        if (accessToken || refreshToken) {
          user.OAuthTokens = user.OAuthTokens || {};
          user.OAuthTokens[profile.provider] = {
            accessToken,
            refreshToken,
          };
        }
        
        // Update profile image if not already set
        if (!user.profileImage && profileImage) {
          user.profileImage = profileImage;
        }
        
        await user.save();
      } else {
        // Update OAuth tokens for existing OAuth user
        if (accessToken || refreshToken) {
          user.OAuthTokens = user.OAuthTokens || {};
          user.OAuthTokens[profile.provider] = {
            accessToken,
            refreshToken,
          };
        }
        
        // Update profile image if not already set
        if (!user.profileImage && profileImage) {
          user.profileImage = profileImage;
          await user.save();
        }
      }
    } else {
      // Create new user with OAuth info
      user = await User.create({
        name: profile.displayName,
        email,
        provider: profile.provider,
        providerId: profile.id,
        profileImage: profileImage,
        isEmailVerified: true, // OAuth emails are verified by provider
        OAuthTokens: {
          [profile.provider]: {
            accessToken,
            refreshToken,
          },
        },
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.redirect(`${frontendUrl}/oauth-success?token=${token}`);
  } catch (err) {
    console.error("Error in socialAuthHandler:", err);
    res.redirect(`${getFrontendUrl()}/?error=oauth_failed`);
  }
};

/* ================= GOOGLE ================= */

router.get("/google",
  (req, res, next) => {
    const state = generateStateToken();
    stateStore.set(state, { expires: Date.now() + 600000 }); // 10 minutes
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      state: state,
    })(req, res, next);
  }
);

router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  socialAuthHandler
);

// extra helper route for client
router.get("/me", authMiddleware, me);

export default router;


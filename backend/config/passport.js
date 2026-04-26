// passport.js

import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";

// Debug: Log if credentials are missing
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("⚠️ GOOGLE_CLIENT_ID is not set in .env file");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("⚠️ GOOGLE_CLIENT_SECRET is not set in .env file");
}

// Get base URL from environment or use default
const getBaseUrl = () => {
  // Explicit BASE_URL override
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  // Production: Vercel sets VERCEL_URL env var
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Development fallback
  return "http://localhost:5000";
};

// Serialize user - store user ID in session
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id || user._id);
  done(null, user.id || user._id);
});

// Deserialize user - retrieve user from database using ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password -OAuthTokens");
    if (!user) {
      return done(null, false);
    }
    console.log("Deserialized user:", user.email);
    done(null, user);
  } catch (err) {
    console.error("Error in deserializeUser:", err);
    done(err, null);
  }
});

// Google Strategy
const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || `${getBaseUrl()}/auth/google/callback`;
console.log("Google OAuth callback URL:", googleCallbackURL);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: googleCallbackURL,
  passReqToCallback: true,
},
(req, accessToken, refreshToken, profile, done) => {
  try {
    console.log("Google OAuth callback received");
    console.log("Google profile ID:", profile.id);
    console.log("Google profile emails:", profile.emails);

    if (!profile.emails || profile.emails.length === 0) {
      console.error("Google Strategy: No emails found in profile");
      return done(new Error("No email found in Google profile"), null);
    }

    // Return user data with tokens
    return done(null, {
      profile: {
        id: profile.id,
        provider: "google",
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Error in Google Strategy verify callback:", err);
    return done(err, null);
  }
}
));


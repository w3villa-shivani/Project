//authController.js

import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "admin";

export const signup = async (req, res) => {
  console.log('Signup attempt:', req.body.email);
  try {
    const { name, email, password, adminSecret } = req.body;

    if (!name) return res.status(400).json({ message: "Name required" });
    if (!email) return res.status(400).json({ message: "Email required" });
    if (!password) return res.status(400).json({ message: "Password required" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role based on admin secret key
    let role = "user";
    if (adminSecret && adminSecret === ADMIN_SECRET_KEY) {
      role = "admin";
    }

    // normal signups create a regular user; providing the correct adminSecret
    // during signup will create an admin account.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
      role: role,
    });

    console.log('User created successfully:', user._id);
    res.status(200).json({ message: "Signup successful! You can now login.", role });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// helper route to fetch information about the currently authenticated user
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "name email role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ message: "Email required" });
    if (!password) return res.status(400).json({ message: "Password required" });

    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Email does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // include role inside the JWT so frontend can make decisions
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


// //authController.js

// import User from "../models/user.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import crypto from "crypto";
// import { sendVerificationEmail } from "../services/emailService.js";

// const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "admin";

// export const signup = async (req, res) => {
//   console.log('Signup attempt:', req.body.email);
//   try {
//     const { name, email, password, adminSecret } = req.body;

//     const userExists = await User.findOne({ email });

//     // If user exists and email is verified, they can't sign up again
//     if (userExists && userExists.isEmailVerified) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     // If user exists but email is NOT verified, delete the unverified record
//     if (userExists && !userExists.isEmailVerified) {
//       console.log(`Deleting unverified user record for ${email}`);
//       await User.deleteOne({ email });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Determine role based on admin secret key
//     let role = "user";
//     if (adminSecret && adminSecret === process.env.ADMIN_SECRET_KEY || adminSecret === "admin") {
//       role = "admin";
//     }

//     // Generate verification token
//     const verificationToken = crypto.randomBytes(32).toString("hex");

//     // Create user with unverified email
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       provider: "local",
//       role: role,
//       isEmailVerified: false,
//       verificationToken: verificationToken,
//       tokenGeneratedAt: new Date(),
//     });

//     // Send verification email
//     await sendVerificationEmail(email, verificationToken);

//     console.log('User created successfully:', user._id);
//     res.status(200).json({ 
//       message: "Signup successful! Check your email to verify your account. The verification link expires in 1 hour.",
//       role 
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('Login attempt for email:', email);

//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(401).json({ message: "User does not exist" });

//     // Check if local user has verified email (skip for OAuth users)
// //     if (user.provider === "local" && !user.isEmailVerified) {
// //       return res.status(401).json({ 
// //         message: "Please verify your email before logging in. Check your inbox for the verification link.",
// //         requiresVerification: true
// //       });
// //     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(401).json({ message: "Invalid credentials" });

//     // include role inside the JWT so frontend can make decisions
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       token,
//       user: { name: user.name, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Verify email with token
// export const verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.params;

//     if (!token) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Verification token is required" 
//       });
//     }

//     // Find user with verification token
//     const user = await User.findOne({ verificationToken: token });
//     if (!user) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Invalid verification link" 
//       });
//     }

//     // Check if token is expired (1 hour = 3600000 ms)
//     const tokenAge = Date.now() - new Date(user.tokenGeneratedAt).getTime();
//     if (tokenAge > 3600000) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Verification link has expired. Please request a new one." 
//       });
//     }

//     // Mark email as verified
//     user.isEmailVerified = true;
//     user.verificationToken = null;
//     user.tokenGeneratedAt = null;
//     await user.save();

//     console.log(`Email verified for user ${user._id}`);
//     res.status(200).json({ 
//       success: true,
//       message: "Email verified successfully! You can now login." 
//     });
//   } catch (err) {
//     console.error('Email verification error:', err);
//     res.status(500).json({ 
//       success: false,
//       message: "Server error" 
//     });
//   }
// };

// // Resend verification email (requires authentication)
// export const resendVerificationEmail = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Generate new verification token
//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     user.verificationToken = verificationToken;
//     user.tokenGeneratedAt = new Date();
//     await user.save();

//     // Send verification email
//     await sendVerificationEmail(user.email, verificationToken);

//     console.log(`Resend verification email to ${user.email}`);
//     res.status(200).json({ 
//       message: "Verification email sent. Check your inbox. The link expires in 1 hour." 
//     });
//   } catch (err) {
//     console.error('Resend verification error:', err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// export const me = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password -OAuthTokens");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         profileImage: user.profileImage || null,
//       },
//     });
//   } catch (err) {
//     console.error('Get user error:', err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
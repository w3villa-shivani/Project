//emailService.js

// import nodemailer from "nodemailer";

// // Create transporter
// const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: process.env.SMTP_HOST || "smtp.gmail.com",
//     port: process.env.SMTP_PORT || 587,
//     secure: process.env.SMTP_SECURE === "true",
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
// };

// // Send verification email
// export const sendVerificationEmail = async (email, verificationToken) => {
//   try {
//     const transporter = createTransporter();
    
//     // Get frontend URL from environment or use localhost for development
//     const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
//     const verificationUrl = `${frontendUrl}/verify/${verificationToken}`;

//     const mailOptions = {
//       from: process.env.SMTP_FROM || process.env.SMTP_USER,
//       to: email,
//       subject: "Email Verification - Verify Your Account",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Verify Your Email Address</h2>
//           <p>Thank you for signing up! Please click the button below to verify your email address:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block;">
//               Verify Email
//             </a>
//           </div>
//           <p>Or copy and paste this link into your browser:</p>
//           <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
//           <p style="color: #999; font-size: 12px; margin-top: 30px;">
//             If you didn't create an account, please ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Verification email sent to ${email}`);
//     return true;
//   } catch (error) {
//     console.error("Error sending verification email:", error);
//     return false;
//   }
// };

// export default { sendVerificationEmail };



import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // Loads variables from .env file

// 1. Create transporter ONCE outside the function
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, // 16-digit App Password
  },
});

// 2. Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter connection error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

// 3. Send verification email
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify/${verificationToken}`;

    const mailOptions = {
      from: `"My Hobby App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirm your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Thank you for signing up! Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007BFF;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

export default { sendVerificationEmail };
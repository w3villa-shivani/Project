//db.js

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    
    // Provide helpful error messages based on error type
    if (error.message.includes("ENOTFOUND")) {
      console.error("=> The cluster hostname could not be found.");
      console.error("=> Please verify your MONGO_URI is correct and the cluster exists.");
      console.error("=> Example: mongodb+srv://<username>:<password>@cluster0.mongodb.net/myapp?...");
    } else if (error.message.includes("authentication failed")) {
      console.error("=> Database authentication failed. Check username and password.");
    } else if (error.message.includes("SCRAM")) {
      console.error("=> SCRAM authentication failed. Verify credentials are correct.");
    }
    
    console.error("=> Server continuing without DB - /health will report status");
    // Don't exit - let server run for health checks
  }

};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

export default connectDB;

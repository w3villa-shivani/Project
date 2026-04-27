//profileController.js

import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import User from "../models/user.js";
import { uploadToStorj } from "../services/storjService.js";



/* =========================
   GET PROFILE
========================= */

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};


/* =========================
   UPDATE ADDRESS
========================= */

export const updateAddress = async (req, res) => {
  try {
    const { address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { address },
      { new: true }
    ).select("-password");

    res.json(user);

  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: "Failed to update address" });
  }
};


/* =========================
   UPLOAD PROFILE IMAGE
========================= */

export const uploadProfilePicture = async (req, res) => {
  try {

    const imageUrl = await uploadToStorj(req.file);

    await User.findByIdAndUpdate(req.user.id, {
      profileImage: imageUrl,
    });

    res.json({
      message: "Profile image uploaded successfully",
      imageUrl,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};


/* =========================
   DOWNLOAD PROFILE
========================= */

export const downloadProfile = async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");

    const profileData = {
      name: user.name,
      email: user.email,
      address: user.address,
      profileImage: user.profileImage
    };

    res.json(profileData);

  } catch (error) {

    console.error("Download profile error:", error);
    res.status(500).json({ message: "Failed to download profile" });

  }
};


/* =========================
   DELETE PROFILE
========================= */

export const deleteProfile = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
};


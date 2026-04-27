//profileRoutes.js

import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getProfile,
  updateAddress,
  uploadProfilePicture,
  downloadProfile,
  deleteProfile,
} from "../controllers/profileController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);

router.put("/address", authMiddleware, updateAddress);

router.post(
  "/upload",
  authMiddleware,
  upload.single("image"),
  uploadProfilePicture
);

router.get("/download", authMiddleware, downloadProfile);
router.delete("/", authMiddleware, deleteProfile);



export default router;

import express from "express";
import {
  createAdvertisements,
  fetchAdvertisements,
  fetchAdvertisementById,
  updateAd,
  deleteAd,
} from "../controllers/advertisement.controller.js";
import { supabaseAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();
console.log("raj")

/**
 * Public Routes
 */
router.get("/", fetchAdvertisements);
router.get("/:id", fetchAdvertisementById);

/**
 * Protected Routes
 */

router.post("/", supabaseAuth, createAdvertisements);
router.put("/:id", supabaseAuth, updateAd);
router.delete("/:id", supabaseAuth, deleteAd);

export default router;

import express from "express";
import {
  createDonor,
  getAllDonors,
  getDonorById,
  updateDonor,
  deleteDonor,
} from "../controllers/donor.controller.js";

// Optional auth middleware
 import { supabaseAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🔓 Public Routes
router.post("/", createDonor);
router.get("/", getAllDonors);
router.get("/:id", getDonorById);

// 🔐 Protected Routes (Optional)
 router.put("/:id", supabaseAuth, updateDonor);  //not working
 router.delete("/:id", supabaseAuth, deleteDonor);


export default router;

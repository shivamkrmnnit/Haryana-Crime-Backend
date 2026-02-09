import express from "express";
import {
  adminSignup,
  adminLogin,
  adminLogout,
  getCurrentAdmin,
  refreshToken,
} from "../controllers/admin.controllers.js";

const router = express.Router();

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.post("/logout", adminLogout);  //not working
router.get("/me", getCurrentAdmin);
router.post("/refresh", refreshToken);

export default router;

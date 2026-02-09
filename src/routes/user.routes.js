import express from "express";
import * as controller from "../controllers/user.controllers.js";

const router = express.Router();

router.post("/signup", controller.userSignup);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/me", controller.me);
router.put("/profile", controller.updateProfile);
router.put("/change-password", controller.changePassword); // not working
router.post("/refresh", controller.refresh);

export default router;

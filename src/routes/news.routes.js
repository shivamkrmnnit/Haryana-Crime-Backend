import express from "express";
import {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
} from "../controllers/news.controllers.js";

import { supabaseAuth, optionalAuth ,adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * =========================
 * CREATE EVENT
 * =========================
 * POST /api/events
 * Protected: Yes
 */
router.post("/", supabaseAuth,adminOnly, createEvent);

/**
 * =========================
 * GET ALL EVENTS
 * =========================
 * GET /api/events
 * Protected: No (optional)
 */
router.get("/", optionalAuth, getAllEvents);

/**
 * =========================
 * GET MY EVENTS
 * =========================
 * GET /api/events/user/my-events
 * Protected: Yes
 */
router.get("/user/my-events", supabaseAuth, getMyEvents);  // not working

/**
 * =========================
 * GET SINGLE EVENT
 * =========================
 * GET /api/events/:id
 * Protected: No (optional)
 */
router.get("/:id", optionalAuth, getSingleEvent);

/**
 * =========================
 * UPDATE EVENT
 * =========================
 * PUT /api/events/:id
 * Protected: Yes
 */
router.put("/:id", supabaseAuth, adminOnly, updateEvent);

/**
 * =========================
 * DELETE EVENT
 * =========================
 * DELETE /api/events/:id
 * Protected: Yes
 */
router.delete("/:id", supabaseAuth,adminOnly, deleteEvent);

export default router;

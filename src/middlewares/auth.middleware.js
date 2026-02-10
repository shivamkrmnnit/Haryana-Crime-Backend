import { supabase ,supabasePublic } from "../config/supabase.js";

/*
 * =========================
 * SUPABASE JWT AUTH MIDDLEWARE
 * =========================
 */
export const supabaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    console.log("data",user);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "user",
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};




/**
 * Optional middleware for public routes
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const {
        data: { user },
      } = await supabasePublic.auth.getUser(token);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || user.role || "user",
        };
      }
    }

    next();
  } catch (err) {
    next();
  }
};

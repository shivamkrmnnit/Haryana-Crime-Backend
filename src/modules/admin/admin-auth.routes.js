import express from "express";
import { supabase } from "../../config/supabase-client.js";

const router = express.Router();

/**
 * =========================
 * ADMIN SIGNUP
 * =========================
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    console.log("Attempting to create admin user...");

    // Create user with admin role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin'
      }
    });

    console.log("Auth Response:", { 
      userId: authData?.user?.id, 
      error: authError?.message 
    });

    if (authError) {
      return res.status(400).json({ 
        message: authError.message
      });
    }

    if (!authData.user) {
      return res.status(500).json({ 
        message: "User creation failed" 
      });
    }

    const userId = authData.user.id;

    // Insert into admin_auth table
    const { error: insertError } = await supabase
      .from("admin_auth")
      .insert([{ 
        id: userId, 
        email, 
        role: "admin" 
      }]);

    if (insertError) {
      console.error("Admin_auth insert error:", insertError);
      
      // Cleanup: delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      
      return res.status(500).json({ 
        message: "Error saving admin data", 
        error: insertError.message
      });
    }

    console.log("Admin created successfully:", userId);

    return res.status(201).json({ 
      message: "Admin created successfully", 
      admin_id: userId,
      email: email
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message
    });
  }
});

/**
 * =========================
 * ADMIN LOGIN
 * =========================
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    console.log("Login attempt for:", email);

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    console.log("User authenticated:", data.user.id);

    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("admin_auth")
      .select("role, created_at")
      .eq("id", data.user.id)
      .single();

    if (adminError || !adminData) {
      console.error("Admin verification failed:", adminError?.message);
      return res.status(403).json({ 
        message: "Access denied - Not an admin account" 
      });
    }

    if (adminData.role !== "admin" && adminData.role !== "super_admin") {
      return res.status(403).json({ 
        message: "Access denied - Invalid role" 
      });
    }

    console.log("Admin login successful:", data.user.id);

    // Return success with user data and tokens
    return res.status(200).json({ 
      message: "Login successful", 
      admin: {
        id: data.user.id,
        email: data.user.email,
        role: adminData.role,
        created_at: adminData.created_at
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * ADMIN LOGOUT
 * =========================
 */
router.post("/logout", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Sign out the user
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ 
        message: "Logout failed", 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      message: "Logout successful" 
    });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * GET CURRENT ADMIN (Verify Token)
 * =========================
 */
router.get("/me", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    // Get admin data
    const { data: adminData, error: adminError } = await supabase
      .from("admin_auth")
      .select("role, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (adminError || !adminData) {
      return res.status(403).json({ 
        message: "Not an admin account" 
      });
    }

    return res.status(200).json({ 
      admin: {
        id: user.id,
        email: user.email,
        role: adminData.role,
        created_at: adminData.created_at,
        updated_at: adminData.updated_at,
        email_confirmed: !!user.email_confirmed_at
      }
    });

  } catch (err) {
    console.error("Get me error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * REFRESH TOKEN
 * =========================
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      return res.status(400).json({ 
        message: "Refresh token is required" 
      });
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error || !data.session) {
      return res.status(401).json({ 
        message: "Invalid or expired refresh token" 
      });
    }

    return res.status(200).json({ 
      message: "Token refreshed successfully",
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    });

  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

export default router;
import express from "express";
import { supabase } from "../../config/supabase-client.js";

const router = express.Router();

/**
 * =========================
 * USER SIGNUP
 * =========================
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body || {};

    // Validation
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

    console.log("Attempting to create user...");

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        role: 'user',
        full_name: full_name || null
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

    // Insert into user_auth table
    const { error: insertError } = await supabase
      .from("user_auth")
      .insert([{ 
        id: userId, 
        email,
        full_name: full_name || null,
        phone: phone || null,
        role: "user",
        is_active: true
      }]);

    if (insertError) {
      console.error("User_auth insert error:", insertError);
      
      // Cleanup: delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      
      return res.status(500).json({ 
        message: "Error saving user data", 
        error: insertError.message
      });
    }

    console.log("User created successfully:", userId);

    return res.status(201).json({ 
      message: "User registered successfully", 
      user_id: userId,
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
 * USER LOGIN
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

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("user_auth")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (userError || !userData) {
      console.error("User data fetch failed:", userError?.message);
      return res.status(403).json({ 
        message: "User account not found" 
      });
    }

    // Check if user is active
    if (!userData.is_active) {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact support." 
      });
    }

    console.log("User login successful:", data.user.id);

    // Return success with user data and tokens
    return res.status(200).json({ 
      message: "Login successful", 
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        created_at: userData.created_at
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
 * USER LOGOUT
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
 * GET CURRENT USER (Verify Token)
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

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("user_auth")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ 
        message: "User data not found" 
      });
    }

    return res.status(200).json({ 
      user: {
        id: user.id,
        email: user.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
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
 * UPDATE USER PROFILE
 * =========================
 */
router.put("/profile", async (req, res) => {
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

    const { full_name, phone } = req.body || {};

    // Update user_auth table
    const { data: updatedData, error: updateError } = await supabase
      .from("user_auth")
      .update({ 
        full_name: full_name || null,
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({ 
        message: "Failed to update profile", 
        error: updateError.message 
      });
    }

    return res.status(200).json({ 
      message: "Profile updated successfully",
      user: {
        id: updatedData.id,
        email: updatedData.email,
        full_name: updatedData.full_name,
        phone: updatedData.phone,
        role: updatedData.role,
        updated_at: updatedData.updated_at
      }
    });

  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * CHANGE PASSWORD
 * =========================
 */
router.put("/change-password", async (req, res) => {
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

    const { new_password } = req.body || {};

    if (!new_password) {
      return res.status(400).json({ 
        message: "New password is required" 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return res.status(500).json({ 
        message: "Failed to update password", 
        error: updateError.message 
      });
    }

    return res.status(200).json({ 
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("Change password error:", err);
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
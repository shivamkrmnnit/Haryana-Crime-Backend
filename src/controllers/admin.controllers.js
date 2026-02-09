import {
  createAdminAuthUser,
  insertAdminProfile,
  deleteAuthUser,
  signInAdmin,
  signOutAdmin,
  getAdminById,
  getUserFromToken,
  refreshAdminSession,
} from "../models/admin.models.js";

/* ======================
   ADMIN SIGNUP
====================== */
export const adminSignup = async (req, res) => {
  try {
    const { email, password, permissions } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    // ✅ Ensure permissions is an array
    const safePermissions = Array.isArray(permissions) ? permissions : [];

    // 1️⃣ Create Auth User
    const { data, error } = await createAdminAuthUser(email, password);
    if (error) return res.status(400).json({ message: error.message });

    const userId = data.user.id;

    // 2️⃣ Insert Admin Profile WITH permissions
    const { error: insertError } = await insertAdminProfile({
      id: userId,
      email,
      role: "admin",
      permissions: safePermissions,
    });

    if (insertError) {
      await deleteAuthUser(userId);
      return res.status(500).json({ message: insertError.message });
    }

    return res.status(201).json({
      message: "Admin created successfully",
      admin_id: userId,
      email,
      permissions: safePermissions,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


/* ======================
   ADMIN LOGIN
====================== */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const { data, error } = await signInAdmin(email, password);
    console.log("Login data:", data, "Error:", error);

    if (error || !data.session)
      return res.status(401).json({ message: "Invalid email or password" });

    const { data: admin, error: adminError } =
      await getAdminById(data.user.id);

    if (adminError || admin.role !== "admin")
      return res.status(403).json({ message: "Access denied" });
    
    console.log("data" , admin);
    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
      },
      session: data.session,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ======================
   ADMIN LOGOUT
====================== */
export const adminLogout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 🔍 Verify token
    const { data, error } = await supabasePublic.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // 🚫 Revoke refresh tokens
    const { error: revokeError } =
      await supabaseAdmin.auth.admin.signOut(data.user.id);

    if (revokeError) {
      return res.status(500).json({ message: revokeError.message });
    }

    return res.json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


/* ======================
   GET CURRENT ADMIN
====================== */
export const getCurrentAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // ✅ VERIFY JWT
    const { data, error } = await getUserFromToken(token);
    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // ✅ FETCH ADMIN PROFILE
    const { data: admin, error: adminError } =
      await getAdminById(data.user.id);

    if (adminError || !admin) {
      return res.status(403).json({ message: "Not an admin" });
    }

    return res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


/* ======================
   REFRESH TOKEN
====================== */
export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token)
      return res.status(400).json({ message: "Refresh token required" });

    const { data, error } = await refreshAdminSession(refresh_token);

    if (error || !data.session)
      return res.status(401).json({ message: "Invalid refresh token" });

    res.json({ session: data.session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

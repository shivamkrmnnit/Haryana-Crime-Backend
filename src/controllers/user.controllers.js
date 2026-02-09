import {
  createAuthUser,
  signInUser,
  getUserFromToken,
  insertUserProfile,
  getUserById,
  updateUserProfile,
  updateAuthPassword,
  refreshSession,
} from "../models/user.models.js";

/* ======================
   SIGNUP
====================== */
export const userSignup = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    // 1️⃣ Create auth user
    const { data, error } = await createAuthUser({
      email,
      password,
      full_name,
      phone,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const userId = data.user.id;

    // 2️⃣ Insert profile
    const { error: profileError } = await insertUserProfile({
      id: userId,
      email,
      full_name,
      phone,
      role: "user",
      is_active: true,
    });

    if (profileError) {
      return res.status(500).json({ message: profileError.message });
    }

    // 3️⃣ Login → TOKEN
    const { data: loginData, error: loginError } =
      await signInUser(email, password);

    if (loginError) {
      return res.status(500).json({ message: loginError.message });
    }

    return res.status(201).json({
      message: "Signup successful",
        user: { id: userId, email, full_name, phone },
      session: loginData.session,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


/* ======================
   LOGIN
====================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await signInUser(email, password);
    if (error) return res.status(401).json({ message: "Invalid credentials" });

    const { data: user } = await getUserById(data.user.id);
    if (!user || !user.is_active)
      return res.status(403).json({ message: "Account disabled" });

    res.json({
      message: "Login successful",
      user,
      session: data.session,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   LOGOUT (SERVER)
====================== */
export const logout = async (req, res) => {
  // ✅ backend does NOTHING
  res.json({ message: "Logout successful" });
};

/* ======================
   ME
====================== */
export const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token" });

    const { data, error } = await getUserFromToken(token);
    if (error || !data.user)
      return res.status(401).json({ message: "Invalid token" });

    const { data: user } = await getUserById(data.user.id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   UPDATE PROFILE
====================== */
export const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { data } = await getUserFromToken(token);

    const { full_name, phone } = req.body;

    const { data: updated } = await updateUserProfile(data.user.id, {
      full_name,
      phone,
    });

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   CHANGE PASSWORD
====================== */
export const changePassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { new_password } = req.body;

    const { data } = await getUserFromToken(token);
    await updateAuthPassword(data.user.id, new_password);

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   REFRESH
====================== */
export const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await refreshSession(refresh_token);

    if (error) return res.status(401).json({ message: "Invalid token" });

    res.json({ session: data.session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

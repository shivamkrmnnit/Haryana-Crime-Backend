import { supabase } from "../config/supabase.js";

/* ======================
   AUTH
====================== */

export const createAuthUser = async ({ email, password, full_name, phone }) => {
  return supabase.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
    user_metadata: {
      role: "user",
      full_name,
    },
  });
};

export const signInUser = async (email, password) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const getUserFromToken = async (token) => {
  return supabase.auth.getUser(token);
};

export const updateAuthPassword = async (userId, password) => {
  return supabase.auth.admin.updateUserById(userId, { password });
};

export const refreshSession = async (refresh_token) => {
  return supabase.auth.refreshSession({ refresh_token });
};

/* ======================
   USER TABLE
====================== */

export const insertUserProfile = async (user) => {
  return supabase.from("user_auth").insert([user]);
};

export const getUserById = async (id) => {
  return supabase.from("user_auth").select("*").eq("id", id).single();
};

export const updateUserProfile = async (id, data) => {
  return supabase
    .from("user_auth")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
};

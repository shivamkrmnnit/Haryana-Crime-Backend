import { supabase , supabasePublic} from "../config/supabase.js";

/* ======================
   AUTH (ADMIN)
====================== */

export const createAdminAuthUser = async (email, password) => {
  return await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
     user_metadata: {
      role: "admin", // optional
    },
  });
};

export const deleteAuthUser = async (userId) => {
  return await supabase.auth.admin.deleteUser(userId);
};

export const signInAdmin = async (email, password) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOutAdmin = async (token) => {
  return await supabasePublic.auth.admin.signOut(token);
};

export const refreshAdminSession = async (refresh_token) => {
  return await supabasePublic.auth.refreshSession({ refresh_token });
};

export const getUserFromToken = async (token) => {
  return await supabasePublic.auth.getUser(token);
};

/* ======================
   ADMIN TABLE
====================== */

export const insertAdminProfile = async ({
  id,
  email,
  role = "admin",
  permissions = [],
}) => {
  return await supabase
    .from("admin_auth")
    .insert([
      {
        id,
        email,
        role,
        permissions,
      },
    ])
    .select()
    .single();
};


export const getAdminById = async (id) => {
  return await supabase
    .from("admin_auth")
    .select("id, email, role, permissions, created_at, updated_at")
    .eq("id", id)
    .single();
};

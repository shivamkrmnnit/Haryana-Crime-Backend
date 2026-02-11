import { supabase } from "../config/supabase.js";

/**
 * Create Ads (multiple rows)
 */
export const insertAdvertisements = async (adsData) => {
  return await supabase
    .from("advertisements")
    .insert(adsData)
    .select();
};

/**
 * Get All Ads (Public)
 */
export const getAdvertisements = async (position) => {
  let query = supabase
    .from("advertisements")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (position) {
    query = query.eq("position", position);
  }

  return await query;
};

/**
 * Get Single Ad
 */
export const getAdvertisementById = async (id) => {
  return await supabase
    .from("advertisements")
    .select("*")
    .eq("id", id)
    .single();
};

/**
 * Update Ad
 */
export const updateAdvertisement = async (id, updateData) => {
  return await supabase
    .from("advertisements")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Delete Ad
 */
export const deleteAdvertisement = async (id) => {
  return await supabase
    .from("advertisements")
    .delete()
    .eq("id", id);
};

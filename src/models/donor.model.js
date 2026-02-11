import {supabase} from "../config/supabase.js";

export const DonorModel = {
  // Create donor
  async create(data) {
    const { data: donor, error } = await supabase
      .from("donors")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return donor;
  },

  // Get all donors
  async getAll() {
    const { data, error } = await supabase
      .from("donors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get donor by ID
  async getById(id) {
    const { data, error } = await supabase
      .from("donors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update donor
  async update(id, updates) {
    const { data, error } = await supabase
      .from("donors")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete donor
  async delete(id) {
    const { error } = await supabase
      .from("donors")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },
};

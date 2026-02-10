import { supabase } from "../config/supabase.js";

export const EventModel = {
  create: async (payload) => {
    return supabase
      .from("events")
      .insert([payload])
      .select()
      .single();
  },

  getAll: async (query) => {
    return query;
  },

  getById: async (id) => {
    return supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
  },

  updateById: async (id, data) => {
    return supabase
      .from("events")
      .update(data)
      .eq("id", id)
      .select()
      .single();
  },

  deleteById: async (id) => {
    return supabase
      .from("events")
      .delete()
      .eq("id", id);
  },

  getByUser: async (userId, from, to) => {
    return supabase
      .from("events")
      .select("*", { count: "exact" })
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .range(from, to);
  }
};

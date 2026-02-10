import { supabase } from "../config/supabase.js";
import { EventModel } from "../models/news.models.js";

/**
 * CREATE EVENT
 */
export const createEvent = async (req, res) => {
  try {
    const {
      short_title,
      priority,
      title,
      subtitle,
      description,
      type,
      writer_name,
      writer_designation,
      police_status,
      fir_status,
      location_name,
      latitude,
      longitude,
      photo_url,
    } = req.body;

    if (!short_title || !priority || !title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const { data, error } = await EventModel.create({
      short_title,
      priority,
      title,
      subtitle,
      description,
      type,
      writer_name,
      writer_designation,
      police_status,
      fir_status,
      location_name,
      latitude,
      longitude,
      photo_url,
      created_by: req.user.id,
    });

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET ALL EVENTS (filters + pagination)
 */
export const getAllEvents = async (req, res) => {
  try {
    const {
      type,
      priority,
      search,
      page = 1,
      limit = 10,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    let query = supabase
      .from("events")
      .select("*", { count: "exact" })
      .range(from, to);

    if (type) query = query.eq("type", type);
    if (priority) query = query.eq("priority", priority);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,location_name.ilike.%${search}%`
      );
    }

    query = query.order(sort_by, {
      ascending: sort_order === "asc",
    });

    const { data, error, count } = await query;
    if (error) throw error;

    res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      limit: Number(limit),
      events: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET SINGLE EVENT
 */
export const getSingleEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await EventModel.getById(id);
    if (error) throw error;

    res.status(200).json({
      success: true,
      event: data,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }
};

/**
 * GET MY EVENTS
 */
export const getMyEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    const { data, error, count } = await EventModel.getByUser(
      req.user.id,
      from,
      to
    );

    if (error) throw error;

    res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      events: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * UPDATE EVENT
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (existing.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { data, error } = await EventModel.updateById(id, req.body);
    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Event updated",
      event: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE EVENT
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (existing.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await EventModel.deleteById(id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

import express from "express";
import { supabase } from "../../config/supabase-client.js";
import { supabaseAuth, optionalAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * =========================
 * CREATE EVENT
 * =========================
 * POST /api/events
 * Protected: Yes
 */
router.post("/", supabaseAuth, async (req, res) => {
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

    // Validation
    if (!short_title || !priority || !title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing: short_title, priority, title, description, type",
      });
    }

    // Insert event
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
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
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          photo_url,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create event",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * =========================
 * GET ALL EVENTS (with filters, search, pagination)
 * =========================
 * GET /api/events
 * Protected: No (optional auth)
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      type,
      priority,
      search,
      page = 1,
      limit = 10,
      sort_by = "created_at",
      sort_order = "desc",
      police_status,
      fir_status,
      // New search parameters
      location,
      writer,
      date_from,
      date_to,
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
      .from("events")
      .select("*", { count: "exact" })
      .range(from, to);

    // ============================================
    // FILTERS
    // ============================================
    
    if (type) {
      query = query.eq("type", type);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (police_status) {
      query = query.eq("police_status", police_status);
    }

    if (fir_status) {
      query = query.eq("fir_status", fir_status);
    }

    // ============================================
    // SEARCH - Multiple Fields (OR condition)
    // ============================================
    
    if (search) {
      // Escape special characters for ILIKE pattern
      const searchTerm = search.trim();
      
      query = query.or(
        `short_title.ilike.%${searchTerm}%,` +
        `title.ilike.%${searchTerm}%,` +
        `subtitle.ilike.%${searchTerm}%,` +
        `description.ilike.%${searchTerm}%,` +
        `location_name.ilike.%${searchTerm}%,` +
        `writer_name.ilike.%${searchTerm}%`
      );
    }

    // ============================================
    // SPECIFIC FIELD SEARCHES
    // ============================================
    
    // Search by location specifically
    if (location) {
      query = query.ilike("location_name", `%${location}%`);
    }

    // Search by writer specifically
    if (writer) {
      query = query.ilike("writer_name", `%${writer}%`);
    }

    // ============================================
    // DATE RANGE FILTER
    // ============================================
    
    if (date_from) {
      query = query.gte("created_at", date_from);
    }

    if (date_to) {
      query = query.lte("created_at", date_to);
    }

    // ============================================
    // SORTING
    // ============================================
    
    const ascending = sort_order.toLowerCase() === "asc";
    query = query.order(sort_by, { ascending });

    // ============================================
    // EXECUTE QUERY
    // ============================================
    
    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch events",
        error: error.message,
      });
    }

    // ============================================
    // RESPONSE WITH METADATA
    // ============================================
    
    return res.status(200).json({
      success: true,
      page: pageNumber,
      limit: pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      hasNextPage: pageNumber < Math.ceil(count / pageSize),
      hasPrevPage: pageNumber > 1,
      filters_applied: {
        search: search || null,
        type: type || null,
        priority: priority || null,
        location: location || null,
        writer: writer || null,
        date_from: date_from || null,
        date_to: date_to || null,
        police_status: police_status || null,
        fir_status: fir_status || null,
      },
      events: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * =========================
 * GET SINGLE EVENT BY ID
 * =========================
 * GET /api/events/:id
 * Protected: No (optional auth)
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch event",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      event: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * =========================
 * UPDATE EVENT
 * =========================
 * PUT /api/events/:id
 * Protected: Yes
 */
router.put("/:id", supabaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
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

    // Check if event exists and user has permission
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      console.error("Supabase error:", fetchError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch event",
        error: fetchError.message,
      });
    }

    // Authorization check (only creator can update)
    if (existingEvent.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this event",
      });
    }

    // Prepare update object (only include provided fields)
    const updateData = {};
    if (short_title !== undefined) updateData.short_title = short_title;
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (writer_name !== undefined) updateData.writer_name = writer_name;
    if (writer_designation !== undefined) updateData.writer_designation = writer_designation;
    if (police_status !== undefined) updateData.police_status = police_status;
    if (fir_status !== undefined) updateData.fir_status = fir_status;
    if (location_name !== undefined) updateData.location_name = location_name;
    if (latitude !== undefined) updateData.latitude = latitude ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? Number(longitude) : null;
    if (photo_url !== undefined) updateData.photo_url = photo_url;

    updateData.updated_at = new Date().toISOString();

    // Update event
    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update event",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * =========================
 * DELETE EVENT
 * =========================
 * DELETE /api/events/:id
 * Protected: Yes
 */
router.delete("/:id", supabaseAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and user has permission
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by, photo_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      console.error("Supabase error:", fetchError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch event",
        error: fetchError.message,
      });
    }

    // Authorization check (only creator or admin can delete)
    if (existingEvent.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this event",
      });
    }

    // Delete associated photo from storage (optional)
    if (existingEvent.photo_url) {
      try {
        // Extract file path from URL
        const urlParts = existingEvent.photo_url.split("/");
        const bucketName = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];

        await supabase.storage.from(bucketName).remove([fileName]);
      } catch (storageErr) {
        console.warn("Failed to delete photo from storage:", storageErr);
        // Continue with event deletion even if photo deletion fails
      }
    }

    // Delete event
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete event",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * =========================
 * GET USER'S EVENTS
 * =========================
 * GET /api/events/user/my-events
 * Protected: Yes
 */
router.get("/user/my-events", supabaseAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("events")
      .select("*", { count: "exact" })
      .eq("created_by", req.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch your events",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      page: pageNumber,
      limit: pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      events: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;
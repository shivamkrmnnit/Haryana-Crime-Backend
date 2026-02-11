import {
  insertAdvertisements,
  getAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
} from "../models/advertisement.models.js";

/**
 * =========================
 * CREATE (Protected)
 * =========================
 */
export const createAdvertisements = async (req, res) => {
  try {
    console.log("shivam")
    const {
      title,
      description,
      position,
      redirect_url,
      image_urls,
      priority = 0,
    } = req.body;

    if (!title || !description || !position || !image_urls) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    if (!Array.isArray(image_urls)) {
      return res.status(400).json({
        message: "image_urls must be an array",
      });
    }

    const adsToInsert = image_urls.map((url) => ({
      title,
      description,
      position,
      redirect_url,
      image_url: url,
      priority,
      created_by: req.user.id,
    }));

    const { data, error } = await insertAdvertisements(adsToInsert);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.status(201).json({
      message: "Advertisements created successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * GET ALL (Public)
 * =========================
 */
export const fetchAdvertisements = async (req, res) => {
  try {
    const { position } = req.query;

    const { data, error } = await getAdvertisements(position);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * GET SINGLE (Public)
 * =========================
 */
export const fetchAdvertisementById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await getAdvertisementById(id);

    if (error) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * UPDATE (Protected)
 * =========================
 */
export const updateAd = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await updateAdvertisement(id, req.body);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({
      message: "Advertisement updated successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * DELETE (Protected)
 * =========================
 */
export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await deleteAdvertisement(id);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({
      message: "Advertisement deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

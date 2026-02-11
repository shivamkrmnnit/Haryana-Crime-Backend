import { v4 as uuidv4 } from "uuid";
import {
  uploadToStorage,
  getPublicFileUrl,
  listUserFiles,
  deleteFileFromStorage,
  downloadFileFromStorage,
} from "../models/communication.models.js";

/**
 * ======================
 * Upload Single File
 * ======================
 */
export const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const ext = req.file.originalname.split(".").pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await uploadToStorage(
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    const {
      data: { publicUrl },
    } = getPublicFileUrl(filePath);

    return res.status(200).json({
      message: "File uploaded successfully",
      file: {
        name: req.file.originalname,
        path: filePath,
        url: publicUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================
 * Upload Multiple Files
 * ======================
 */
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const userId = req.user.id;
    const uploadedFiles = [];

    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `${userId}/${fileName}`;

      const { error } = await uploadToStorage(
        filePath,
        file.buffer,
        file.mimetype
      );

      if (!error) {
        const {
          data: { publicUrl },
        } = getPublicFileUrl(filePath);

        uploadedFiles.push({
          name: file.originalname,
          path: filePath,
          url: publicUrl,
        });
      }
    }

    res.json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================
 * List Files
 * ======================
 */
export const listFiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await listUserFiles(userId);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    const files = data.map((file) => {
      const {
        data: { publicUrl },
      } = getPublicFileUrl(`${userId}/${file.name}`);

      return {
        name: file.name,
        size: file.metadata?.size,
        created_at: file.created_at,
        url: publicUrl,
      };
    });

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================
 * Delete File
 * ======================
 */
export const deleteFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.params;

    const { error } = await deleteFileFromStorage(
      `${userId}/${filename}`
    );

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================
 * Download File
 * ======================
 */
export const downloadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.params;

    const { data, error } = await downloadFileFromStorage(
      `${userId}/${filename}`
    );

    if (error) {
      return res.status(404).json({ message: "File not found" });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Type", data.type);

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

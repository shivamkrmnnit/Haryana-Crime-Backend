import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../../config/supabase-client.js";
import { supabaseAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * =========================
 * MULTER CONFIG
 * =========================
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "video/mp4",
      "video/quicktime",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

/**
 * =========================
 * UPLOAD SINGLE FILE
 * =========================
 */
router.post(
  "/single",
  supabaseAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const ext = req.file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      res.status(200).json({
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
  }
);

/**
 * =========================
 * UPLOAD MULTIPLE FILES
 * =========================
 */
router.post(
  "/multiple",
  supabaseAuth,
  upload.array("files", 5),
  async (req, res) => {
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

        const { error } = await supabase.storage
          .from("uploads")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from("uploads")
            .getPublicUrl(filePath);

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
  }
);

/**
 * =========================
 * LIST USER FILES
 * =========================
 */
router.get("/list", supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase.storage
      .from("uploads")
      .list(userId, { limit: 100 });

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    const files = data.map((file) => {
      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(`${userId}/${file.name}`);

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
});

/**
 * =========================
 * DELETE FILE
 * =========================
 */
router.delete("/:filename", supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.params;

    const { error } = await supabase.storage
      .from("uploads")
      .remove([`${userId}/${filename}`]);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * =========================
 * DOWNLOAD FILE
 * =========================
 */
router.get("/download/:filename", supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.params;

    const { data, error } = await supabase.storage
      .from("uploads")
      .download(`${userId}/${filename}`);

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
});

export default router;

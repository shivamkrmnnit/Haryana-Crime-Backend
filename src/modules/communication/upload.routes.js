import express from "express";
import { supabase } from "../../config/supabase-client.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/mpeg',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, Word docs, and videos are allowed.'));
    }
  }
});

/**
 * =========================
 * UPLOAD SINGLE FILE
 * =========================
 */
router.post("/single", upload.single("file"), async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: "No file uploaded" 
      });
    }

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log("Uploading file:", filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ 
        message: "File upload failed", 
        error: error.message 
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    console.log("File uploaded successfully:", publicUrl);

    return res.status(200).json({
      message: "File uploaded successfully",
      file: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        path: filePath,
        url: publicUrl
      }
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * UPLOAD MULTIPLE FILES
 * =========================
 */
router.post("/multiple", upload.array("files", 5), async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        message: "No files uploaded" 
      });
    }

    console.log(`Uploading ${req.files.length} files...`);

    const uploadedFiles = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (error) {
          errors.push({
            file: file.originalname,
            error: error.message
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          path: filePath,
          url: publicUrl
        });

      } catch (err) {
        errors.push({
          file: file.originalname,
          error: err.message
        });
      }
    }

    return res.status(200).json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * GET USER FILES (List)
 * =========================
 */
router.get("/list", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    // List files in user's folder
    const { data, error } = await supabase.storage
      .from('uploads')
      .list(user.id, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error("List error:", error);
      return res.status(500).json({ 
        message: "Failed to list files", 
        error: error.message 
      });
    }

    // Add public URLs to each file
    const filesWithUrls = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(`${user.id}/${file.name}`);

      return {
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        created_at: file.created_at,
        updated_at: file.updated_at,
        url: publicUrl
      };
    });

    return res.status(200).json({
      message: "Files retrieved successfully",
      count: filesWithUrls.length,
      files: filesWithUrls
    });

  } catch (err) {
    console.error("List files error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * DELETE FILE
 * =========================
 */
router.delete("/:filename", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ 
        message: "Filename is required" 
      });
    }

    const filePath = `${user.id}/${filename}`;

    console.log("Deleting file:", filePath);

    // Delete file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ 
        message: "File deletion failed", 
        error: error.message 
      });
    }

    return res.status(200).json({
      message: "File deleted successfully",
      file: filename
    });

  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

/**
 * =========================
 * DOWNLOAD FILE
 * =========================
 */
router.get("/download/:filename", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ 
        message: "Filename is required" 
      });
    }

    const filePath = `${user.id}/${filename}`;

    console.log("Downloading file:", filePath);

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .download(filePath);

    if (error) {
      console.error("Download error:", error);
      return res.status(404).json({ 
        message: "File not found", 
        error: error.message 
      });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer());

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', data.type);

    return res.send(buffer);

  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

export default router;
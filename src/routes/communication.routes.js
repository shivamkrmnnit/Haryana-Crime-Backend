import express from "express";
import { supabaseAuth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  listFiles,
  deleteFile,
  downloadFile,
} from "../controllers/communication.controllers.js";

const router = express.Router();

router.post("/single", supabaseAuth, upload.single("file"), uploadSingleFile);

router.post(
  "/multiple",
  supabaseAuth,
  upload.array("files", 5),
  uploadMultipleFiles
);

router.get("/list",supabaseAuth, listFiles); 

router.delete("/:filename", supabaseAuth, deleteFile);

router.get("/download/:filename", supabaseAuth, downloadFile);

export default router;

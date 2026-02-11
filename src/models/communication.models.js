import { supabase } from "../config/supabase.js";

const BUCKET = "uploads";

export const uploadToStorage = async (filePath, buffer, mimetype) => {
  return await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: mimetype,
    });
};

export const getPublicFileUrl = (filePath) => {
  return supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);
};

export const listUserFiles = async (userId) => {
  return await supabase.storage
    .from(BUCKET)
    .list(userId, { limit: 100 });
};

export const deleteFileFromStorage = async (filePath) => {
  return await supabase.storage
    .from(BUCKET)
    .remove([filePath]);
};

export const downloadFileFromStorage = async (filePath) => {
  return await supabase.storage
    .from(BUCKET)
    .download(filePath);
};

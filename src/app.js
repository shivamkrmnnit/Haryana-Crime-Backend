import express from "express";
import cors from "cors";
// import adminAuthRoutes from "./modules/admin/admin-auth.routes.js";
// import userAuthRoutes from "./modules/user/user-auth.routes.js";
// import uploadRoutes from "./modules/communication/upload.routes.js";
// import newRoutes from "./modules/news/event.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userAuthRoutes from "./routes/user.routes.js";
import newsRoutes from "./routes/news.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

// Admin auth routes
app.use("/api/v1/admin", adminRoutes);

// User auth routes
app.use("/api/v1/user", userAuthRoutes);

// Upload routes
// app.use("/api/v1/upload", uploadRoutes);  // Add this
// News event routes
 app.use("/api/v1/admin/events", newsRoutes);

export default app;
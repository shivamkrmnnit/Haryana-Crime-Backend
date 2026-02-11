import express from "express";
import cors from "cors";

import adminRoutes from "./routes/admin.routes.js";
import userAuthRoutes from "./routes/user.routes.js";
import newsRoutes from "./routes/news.routes.js"
import uploadRoutes from "./routes/communication.routes.js"
import advertisementRoutes from "./routes/advertisement.routes.js"
import donorRoutes from "./routes/donor.routes.js";

const app = express();

app.use(cors());
app.use(express.json());



app.use("/api/v1/donors", donorRoutes);

// Admin auth routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/advertisements", advertisementRoutes);

// User auth routes
app.use("/api/v1/user", userAuthRoutes);

// Upload routes
 app.use("/api/v1/upload", uploadRoutes);  // Add this
// News event routes
 app.use("/api/v1/admin/events", newsRoutes);

export default app;
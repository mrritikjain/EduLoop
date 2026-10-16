import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from process.cwd() and fallback to Server/.env if needed
dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import authRoute from "./Routes/authRoutes.js";
import listingRoute from "./Routes/listingRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "EduLoop API is running 🚀" });
});

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/listings", listingRoute);
app.use("/api/listing", listingRoute); // Alias for singular route

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;

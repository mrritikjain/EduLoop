import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import authRoute from "./Routes/authRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "EduLoop API is running 🚀" });
});

app.use("/api/auth", authRoute);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
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
  }
};

startServer();

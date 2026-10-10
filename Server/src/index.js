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

app.use("/api/auth", authRoute);

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

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment variables (.env)");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "eduloop",
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    console.error(
      "💡 Tip: If using MongoDB Atlas, make sure your IP is whitelisted (Network Access -> Add IP Address -> 0.0.0.0/0 for development) and your credentials are correct."
    );
    process.exit(1);
  }
};

export default connectDB;

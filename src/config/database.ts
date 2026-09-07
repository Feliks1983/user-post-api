import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI не найден в .env");
  }

  if (isConnected) {
    return {
      connected: true,
      db: mongoose.connection.db,
    };
  }

  try {
    if (
      mongoose.connection.readyState === mongoose.ConnectionStates.connected
    ) {
      isConnected = true;

      return {
        connected: true,
        db: mongoose.connection.db,
      };
    }

    await mongoose.connect(uri, {
      dbName: "todopost",
    });

    isConnected = true;

    console.log("Connected to MongoDB!");
    console.log("Database:", mongoose.connection.name);

    return {
      connected: true,
      db: mongoose.connection.db,
    };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export default connectDB;

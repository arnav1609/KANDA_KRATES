import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Farmer from "./models/Farmer.js";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/kandakrates");

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB error:", err);
});

app.get("/", (req, res) => {
  res.send("Kanda Krates Backend Running");
});

// Add a POST endpoint to store farmer data
app.post("/api/farmer", async (req, res) => {
  const { username, phoneNumber, sensorData } = req.body;

  if (!username || !phoneNumber || !sensorData) {
    return res.status(400).json({ error: "Username, phone number, and sensor data are required." });
  }

  try {
    // Check if the farmer already exists
    let farmer = await Farmer.findOne({ username });

    if (farmer) {
      // Update existing farmer's phone number and sensor data
      farmer.phoneNumber = phoneNumber;
      farmer.sensorData = sensorData;
      await farmer.save();
      return res.status(200).json({ message: "Farmer data updated successfully." });
    }

    // Create a new farmer entry
    farmer = new Farmer({ username, phoneNumber, sensorData });
    await farmer.save();
    res.status(201).json({ message: "Farmer data saved successfully." });
  } catch (error) {
    console.error("Error saving farmer data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Add a GET endpoint to retrieve all sensor data for all farmers
app.get("/api/farmers", async (req, res) => {
  try {
    const farmers = await Farmer.find();
    res.status(200).json(farmers);
  } catch (error) {
    console.error("Error retrieving farmers data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
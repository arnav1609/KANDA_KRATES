import mongoose from "mongoose";

const sensorHistorySchema = new mongoose.Schema({
  crateId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  mq135: { type: Number, required: true }, // Methane
  mq137: { type: Number, required: true }  // Ammonia
});

export default mongoose.model("SensorHistory", sensorHistorySchema);

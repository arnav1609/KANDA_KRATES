import mongoose from "mongoose";

const crateSchema = new mongoose.Schema({
  crateId: { type: String, required: true, unique: true }, // e.g., "crate1", "crate2"
  assignedFarmerUsername: { type: String, required: true }, // Links to Farmer
  hardwareMacAddress: { type: String }, // Optional hardware pairing ID
  registeredAt: { type: Date, default: Date.now }
});

export default mongoose.model("Crate", crateSchema);

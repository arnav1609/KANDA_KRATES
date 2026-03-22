import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  sensorData: { type: Object, default: {} },
});

const Farmer = mongoose.model("Farmer", farmerSchema);

export default Farmer;
import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  sensorData: { type: Object, required: true },
  phoneNumber: { type: String, required: true },
});

const Farmer = mongoose.model("Farmer", farmerSchema);

export default Farmer;
import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  password:    { type: String, required: true },
  createdAt:   { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;

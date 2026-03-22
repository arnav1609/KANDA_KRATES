import mongoose from "mongoose";
import Farmer from "./models/Farmer.js";

async function test() {
  await mongoose.connect("mongodb://127.0.0.1:27017/kandakrates");
  try {
    const f = await Farmer.create({ username: "test_script", phoneNumber: "123", password: "123" });
    console.log("Success:", f);
  } catch (err) {
    console.error("Mongoose Error:", err);
  }
  process.exit(0);
}
test();

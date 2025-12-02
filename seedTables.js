import mongoose from "mongoose";
import dotenv from "dotenv";
import Table from "./models/Table.js";

dotenv.config();

const tables = [
  { name: "T1", capacity: 2, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T2", capacity: 2, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T3", capacity: 2, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T4", capacity: 4, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T5", capacity: 4, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T6", capacity: 4, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T7", capacity: 8, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T8", capacity: 8, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
  { name: "T9", capacity: 8, status: "open", customerName: "", customerEmail: "", startTime: null, endTime: null },
];

const seedTables = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Table.deleteMany({});
    await Table.insertMany(tables);
    console.log("✅ Tables seeded successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding tables:", err);
  }
};

seedTables();

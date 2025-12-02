// models/Table.js
import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ["open", "occupied", "free"], default: "open" }, // <-- add "free"
  customerName: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  AssignedWaiter: { type: String, default: "" },
  startTime: { type: Date },
  endTime: { type: Date },
});

const Table = mongoose.model("Table", TableSchema);
export default Table;

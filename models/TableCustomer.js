import mongoose from "mongoose";

const TableCustomerSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  tableName: { type: String, required: true },
  newSessionId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  status: { type: String, enum: ["occupied", "completed"], default: "occupied" },
  date: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  billAmount: { type: Number, default: 0 },
  customerCount: { type: Number, default: 1 } // global count per table
});

const TableCustomer = mongoose.model("TableCustomer", TableCustomerSchema);

export default TableCustomer;

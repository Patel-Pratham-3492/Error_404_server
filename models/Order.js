import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  customization: { type: String },
  category: { type: String, required: true },
});

const OrderSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  tableName: { type: String, required: true },
  customerCount: { type: Number, default: 1 },
  newSessionId: { type: String, required: true },
  priority: { type: Number, default: 1 },
  status: { type: String, default: "pending" },
  paymentstatus: { type: String, required: true },
  items: [OrderItemSchema],
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;

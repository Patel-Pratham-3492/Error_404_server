import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  tableName: { type: String, required: true },
  customerCount: { type: Number, default: 1 },
  newSessionId: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      category: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      customization: { type: String },
    },
  ],
  totalQty: { type: Number, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["cash", "card"], default: "cash" },
  cardNumber: { type: String },
  paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" }, // NEW
  date: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;

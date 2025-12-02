import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema({
  reservationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  people: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, default: "pending" },   // 👈 NEW FIELD
  createdAt: { type: Date, default: Date.now },
});

const Reservation = mongoose.model("Reservation", ReservationSchema);

export default Reservation;

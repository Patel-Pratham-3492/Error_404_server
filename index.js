import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./userRoutes.js";
import createReservation from "./createreservation.js";
import tableActions from "./tableActions.js";
import Table from "./models/Table.js";
import waitersRoute from "./waiter.js";
import tablesRoute from "./table.js";
import menuRoutes from "./menu.js"
import orderRoutes from "./order.js";
import paymentRoutes from "./payment.js";
import menuRoute from "./menuswaiter.js";
import DashRoute from "./dashboard.js";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // 🔥 Seed tables if empty
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tables = [
        { name: "T1", capacity: 2 },
        { name: "T2", capacity: 2 },
        { name: "T3", capacity: 2 },
        { name: "T4", capacity: 4 },
        { name: "T5", capacity: 4 },
        { name: "T6", capacity: 4 },
        { name: "T7", capacity: 8 },
        { name: "T8", capacity: 8 },
        { name: "T9", capacity: 8 },
      ];

      await Table.insertMany(tables);
      console.log("✅ Tables seeded!");
    }

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use("/api/reservations", createReservation);
app.use("/api/table", tableActions);
app.use("/api/waiters", waitersRoute);
app.use("/api/tables", tablesRoute);
app.use("/api/menu", menuRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/menu/waiter", menuRoute);
app.use("/api/dashboard", DashRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

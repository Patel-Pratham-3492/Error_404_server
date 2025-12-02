// routes/tables.js
import express from "express";
import Table from "./models/Table.js";

const router = express.Router();

// GET ALL TABLES
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ASSIGN WAITER
router.post("/assign", async (req, res) => {
  try {
    const { waiterId, tables } = req.body;

    await Table.updateMany(
      { name: { $in: tables } },
      { $set: { AssignedWaiter: waiterId } }
    );

    res.json({ message: "Assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Assignment failed" });
  }
});

// REMOVE WAITER
router.post("/remove", async (req, res) => {
  try {
    const { tables } = req.body;

    await Table.updateMany(
      { name: { $in: tables } },
      { $set: { AssignedWaiter: "" } }
    );

    res.json({ message: "Removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Remove failed" });
  }
});

export default router;

import express from "express";
import Table from "./models/Table.js";
import TableCustomer from "./models/TableCustomer.js";
import Counter from "./models/Counter.js";

const router = express.Router();

// GET all tables
// GET all tables with customer count if occupied
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find({});

    const tablesWithCustomerCount = await Promise.all(
      tables.map(async (table) => {
        let customerCount = 0;
        let newSessionId = 0;
        if (table.status === "occupied") {
          // Get matching TableCustomer entry
          const customerRecord = await TableCustomer.findOne({
            tableId: table._id,
            status: "occupied"
          }).sort({ startTime: -1 });

          if (customerRecord) {
            customerCount = customerRecord.customerCount;
            newSessionId = customerRecord.newSessionId;
          }
        }

        return {
          ...table._doc,
          customerCount,
          newSessionId
        };
      })
    );

    res.json({ success: true, tables: tablesWithCustomerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tables with customer count"
    });
  }
});


router.put("/occupy/:id", async (req, res) => {
  const { id } = req.params;
  const { customerName, customerEmail } = req.body;

  try {
    const table = await Table.findById(id);
    if (!table)
      return res.status(404).json({ success: false, message: "Table not found" });

    const startTime = new Date();

    // Update table info
    table.customerName = customerName;
    table.customerEmail = customerEmail;
    table.status = "occupied";
    table.startTime = startTime;
    await table.save();

    // Increment global counter
    let counter = await Counter.findOne({ name: "global-customer-counter" });
    if (!counter) {
      counter = new Counter({ count: 1 });
    } else {
      counter.count += 1;
    }
    await counter.save();

    // Create TableCustomer record and assign updated global count
    const now = new Date();
    const today = now.toISOString().slice(0,10).replace(/-/g, ""); // YYYYMMDD

    const newSessionId = table.name + `${Date.now()}`;
    const tableCustomer = new TableCustomer({
      tableId: table._id,
      tableName: table.name,
      newSessionId : newSessionId,
      customerName,
      customerEmail,
      status: "occupied",
      date: today,
      startTime,
      billAmount: 0,
      customerCount: counter.count, // <---- assign updated global count
    });
    await tableCustomer.save();

    res.json({ success: true, table, tableCustomer, globalCount: counter.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to occupy table" });
  }
});


// PUT mark table as open (host)
router.put("/open/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) 
      return res.status(404).json({ success: false, message: "Table not found" });

    // Only allow marking open if table is currently occupied
    if (table.status !== "free") {
      return res.status(400).json({ success: false, message: "Only occupied tables can be marked as open" });
    }

    const endTime = new Date();

    // Update table
    table.status = "open";
    table.customerName = "";
    table.customerEmail = "";
    table.startTime = null;
    table.endTime = endTime;
    await table.save();

    // Update last occupied record in TableCustomer
    const lastRecord = await TableCustomer.findOne({
      tableId: table._id,
      status: "occupied",
    }).sort({ startTime: -1 });

    if (lastRecord) {
      lastRecord.status = "completed";
      lastRecord.endTime = endTime;
      await lastRecord.save();
    }

    res.json({ success: true, table, lastRecord });
  } catch (err) {
    console.error("Error opening table:", err);
    res.status(500).json({ success: false, message: "Failed to open table" });
  }
});

router.put("/free/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table)
      return res.status(404).json({ success: false, message: "Table not found" });

    // Only allow waiter to free if table is occupied
    if (table.status !== "occupied") {
      return res.status(400).json({ success: false, message: "Table is not occupied" });
    }

    // Update fields
    table.status = "free";
    table.customerName = "";
    table.customerEmail = "";

    await table.save();

    res.json({ success: true, table, message: "Table freed by waiter" });

  } catch (err) {
    console.error("Failed to free table:", err);
    res.status(500).json({ success: false, message: "Failed to free table" });
  }
});

export default router;
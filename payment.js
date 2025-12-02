import express from "express";
import Payment from "./models/Payment.js";

const router = express.Router();

// --- Get all payments ---
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find({});
    res.json({ success: true, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
});


// GET /api/payment/today/all
router.get("/today/all", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // today start

    const end = new Date();
    end.setHours(23, 59, 59, 999); // today end

    // Fetch all payments for today
    const payments = await Payment.find({
      date: { $gte: start, $lte: end }
    }).sort({ tableName: 1 });

    res.json({ success: true, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch today's payments" });
  }
});


// --- Get payments for a specific table by customerCount ---
router.get("/table/:customerCount", async (req, res) => {
  try {
    const customerCount = req.params.customerCount;

    // Find all payments for this customerCount
    const payments = await Payment.find({ customerCount });

    if (!payments || payments.length === 0) {
      return res.json({ success: true, payments: [] }); // return empty array instead of 404
    }

    // Aggregate pending payments for collection
    const pendingPayments = payments.filter(p => p.paymentStatus === "pending");

    let totalQty = 0;
    let totalAmount = 0;
    const aggregatedItems = [];

    pendingPayments.forEach(p => {
      p.items.forEach(i => {
        aggregatedItems.push(i);
        totalQty += i.quantity;
        totalAmount += i.price * i.quantity;
      });
    });

    res.json({
      success: true,
      tableId: payments[0].tableId,
      tableName: payments[0].tableName,
      items: aggregatedItems,
      totalQty,
      totalAmount,
      paymentsIds: pendingPayments.map(p => p._id),
      allPayments: payments, // include all for showing paid items
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch payments for table" });
  }
});

// --- Collect payment for multiple payments at once ---
router.put("/collect-multiple", async (req, res) => {
  try {
    const { paymentsIds, method, cardNumber } = req.body;

    if (!paymentsIds || !paymentsIds.length) {
      return res.status(400).json({ success: false, message: "No payments selected" });
    }

    const updated = await Payment.updateMany(
      { _id: { $in: paymentsIds }, paymentStatus: "pending" }, // only pending payments
      {
        $set: {
          paymentStatus: "paid",
          method,
          cardNumber: method === "card" ? cardNumber : "",
        },
      }
    );

    res.json({
      success: true,
      message: "Payment collected",
      updatedCount: updated.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to collect payments" });
  }
});

export default router;

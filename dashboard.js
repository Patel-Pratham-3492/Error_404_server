import express from "express";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";

const router = express.Router();
router.get("/today-stats", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Fetch today's payments
    const payments = await Payment.find({
      date: { $gte: start, $lte: end }
    });

    // TOTAL REVENUE
    const totalRevenue = payments.reduce((sum, p) => {
      const itemsTotal = p.items.reduce(
        (a, i) => a + i.price * i.quantity,
        0
      );
      return sum + itemsTotal;
    }, 0);

    // TOTAL ORDERS (each payment = 1 ordered item)
    const totalOrders = payments.length;

    // TOTAL CUSTOMERS (unique sessionId)
    const totalCustomers = new Set(payments.map(p => p.newSessionId)).size;

    // PENDING PAYMENTS COUNT
    const pendingPayments = payments.filter(p => p.paymentStatus === "pending").length;

    // PAID PAYMENTS COUNT
    const paidPayments = payments.filter(p => p.paymentStatus === "paid").length;

    // TOTAL items sold (summing quantities)
    const totalItemsSold = payments.reduce(
      (sum, p) =>
        sum + p.items.reduce((qSum, i) => qSum + i.quantity, 0),
      0
    );

    // Avg revenue per customer
    const avgRevenuePerCustomer =
      totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    res.json({
      success: true,
      totalOrders,
      totalRevenue,
      totalCustomers,
      pendingPayments,
      paidPayments,
      totalItemsSold,
      avgRevenuePerCustomer: avgRevenuePerCustomer.toFixed(2)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load stats" });
  }
});


router.get("/", async (req, res) => {
  try {
    const range = req.query.range || "today";
    const now = new Date();
    let start, end;

    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (range === "week") {
      const day = now.getDay(); // Sunday = 0
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day));
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const payments = await Payment.find({
      date: { $gte: start, $lt: end },
    });

    const paidPayments = payments.filter(p => p.paymentStatus === "paid");
    const pendingPayments = payments.filter(p => p.paymentStatus === "pending");

    const totalRevenue = paidPayments.reduce((acc, p) => {
      const itemsTotal = p.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return acc + itemsTotal;
    }, 0);

    const totalOrders = payments.length;
    const totalCustomers = new Set(payments.map(p => p.newSessionId)).size;

    const totalItemsSold = paidPayments.reduce((acc, p) => {
      return acc + p.items.reduce((sum, i) => sum + i.quantity, 0);
    }, 0);

    const avgRevenuePerCustomer = totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(2) : 0;

    res.json({
      success: true,
      totalRevenue,
      totalOrders,
      totalCustomers,
      pendingPayments: pendingPayments.length,
      paidPayments: paidPayments.length,
      totalItemsSold,
      avgRevenuePerCustomer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
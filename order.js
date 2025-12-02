import express from "express";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";

const router = express.Router();

// --- Create new order ---
// Create new order items (each as separate row)
router.post("/", async (req, res) => {
  try {
    const { tableId, tableName, customerCount, newSessionId, priority, paymentstatus, items } = req.body;

    const savedOrders = [];

    for (const item of items) {
      const order = new Order({
        tableId,
        tableName,
        customerCount,
        newSessionId,
        priority,
        paymentstatus,
        items: [item], // store single item as array with 1 element
      });
      await order.save();
      savedOrders.push(order);
    }

    res.json({ success: true, orders: savedOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create order items" });
  }
});

// --- Get today's orders ---
router.get("/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});


// --- Cancel/Delete order ---
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
});

// --- Get orders for a specific table (payment) ---
router.get("/table/:tableId", async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const orders = await Order.find({ tableId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this table" });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching table orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Update order status
    order.status = status;
    await order.save();

    // Only create payment if status is done and payment doesn't exist yet
    if (status === "done") {
      const existingPayment = await Payment.findOne({ orderId: order._id });
      if (!existingPayment) {
        const item = order.items[0]; // single item
        const totalAmount = item.price * item.quantity;

        const payment = new Payment({
          orderId: order._id,
          tableId: order.tableId,
          tableName: order.tableName,
          customerCount: order.customerCount,
          newSessionId :  order.newSessionId,
          items: [
            {
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              price: item.price,
              customization: item.customization || "",
            },
          ],
          totalQty: item.quantity,
          amount: totalAmount,
          method: "cash",
          paymentStatus: "pending",
        });

        await payment.save();
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
});



// PUT /api/order/:id/update-item
router.put("/:id/update-item", async (req, res) => {
  try {
    const orderId = req.params.id;
    const { items } = req.body; // updated items array

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Items must be an array" });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update the items array
    order.items = items;

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update order items" });
  }
});


export default router;

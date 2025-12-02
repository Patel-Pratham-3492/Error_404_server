// routes/waiters.js
import express from "express";
import User from "./models/userModel.js";   // your user model

const router = express.Router();

// GET ALL WAITERS
router.get("/", async (req, res) => {
  try {
    const waiters = await User.find({ role: "waiter" });
    res.json(waiters);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

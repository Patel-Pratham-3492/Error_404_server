import express from "express";
import MenuItem from "./models/MenuItem.js";

const router = express.Router();

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch menu items" });
  }
});

export default router;

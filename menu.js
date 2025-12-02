import express from "express";
import MenuItem from "./models/MenuItem.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// 🟢 Get all menu items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 Add new menu item
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { category, subCategory, name, Description, price, special } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newItem = new MenuItem({ category, subCategory, name, Description, price, special, image });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "Failed to add item" });
  }
});

// 🟢 Update menu item
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { category, subCategory, name, price, special } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { category, subCategory, name, price, special, ...(image && { image }) },
      { new: true }
    );

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: "Failed to update item" });
  }
});

// 🟢 Delete menu item
router.delete("/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item" });
  }
});

export default router;

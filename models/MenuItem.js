import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema({
  category: { type: String, enum: ["food", "beverage"], required: true },
  subCategory: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  Description: { type: String, required: true },
  special: { type: Boolean, default: false },
  image: { type: String }, // stores image file path
}, { timestamps: true });

const MenuItem = mongoose.model("MenuItem", MenuItemSchema);
export default MenuItem;

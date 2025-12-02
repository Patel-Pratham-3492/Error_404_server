import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // login id used by system (email for all roles except waiter)
  userId: { type: String, required: true },

  // only used to track individual waiters
  waiterId: { type: String, default: null },

  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);

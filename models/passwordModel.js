import mongoose from "mongoose";

const passwordSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ["waiter", "chef"], // you can add more roles if needed
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Password = mongoose.model("Password", passwordSchema);

export default Password;

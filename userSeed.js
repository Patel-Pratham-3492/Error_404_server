import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './userModel.js';

dotenv.config();

const insertUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for seeding...');

    // Create a new user
    const user = new User({
      email: 'patel@example.com',
      password: '12345678',
      role: 'customer',
    });

    await user.save();
    console.log('✅ User inserted successfully:', user);

    await mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected');
  } catch (error) {
    console.error('❌ Error inserting user:', error.message);
  }
};

insertUser();

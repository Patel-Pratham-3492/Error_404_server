import express from 'express';
import User from './models/userModel.js';
import Password from "./models/passwordModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// POST /api/users/login
// POST /api/users/login
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // ⭐ If user is waiter → send response requiring waiterId popup
    if (user.role === "waiter") {
      return res.json({
        needWaiterId: true,
        role: "waiter",
        email: user.email,
        _id: user._id,
      });
    }

    // ⭐ All other roles → normal login
    res.json({
      message: "Login successful",
      role: user.role,
      firstName: user.firstName,
      userId: user.userId,
      _id: user._id,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// POST /api/users/check_waiterid
router.post("/check_waiterid", async (req, res) => {
  const { waiterId } = req.body;

  try {
    const user = await User.findOne({waiterId, role: "waiter" });

    if (!user) {
      return res.status(404).json({ message: "Waiter account not found" });
    }

    if (user.waiterId !== waiterId) {
      return res.status(400).json({ message: "Invalid Waiter ID" });
    }

    // SUCCESS → return full login info
    return res.json({
      message: "Waiter verified",
      firstName: user.firstName,
      userId: user.userId,
      waiterId: user.waiterId
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});




const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.RESTAURANT_EMAIL,
    pass: process.env.RESTAURANT_EMAIL_PASSWORD,
  },
});

// POST /api/users/send - Hire user
router.post("/send", async (req, res) => {
  const { firstName, lastName, role, email, waiterId } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let password, userId;

    if (role === "waiter" || role === "chef") {
      // KEEP OLD LOGIC → use shared accounts from passwords collection
      const sharedCreds = await Password.findOne({ role });
      if (!sharedCreds) {
        return res.status(500).json({ message: "Shared credentials not found" });
      }

      userId = sharedCreds.userId;    // SAME AS BEFORE
      password = sharedCreds.password; // SAME AS BEFORE

    } else {
      // Unique login for manager & host
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      password = `${firstName[0]}${randomDigits}${lastName[0]}`;
      userId = email; // SAME AS BEFORE
    }

    // Save user
    const newUser = new User({
      firstName,
      lastName,
      role,
      email,
      password,
      userId,                        // keep old behavior
      waiterId: role === "waiter" ? waiterId : null // new field only for waiters
    });

    await newUser.save();

    const htmlContent = getRoleEmailHTML({ 
  role: newUser.role, 
  firstName: newUser.firstName, 
  userId: newUser.userId, 
  password: newUser.password, 
  waiterId: newUser.waiterId 
});
    // Email content
    const mailOptions = {
      from: process.env.RESTAURANT_EMAIL,
      to: email,
      subject: "Your Account Credentials",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "User created and email sent",
      userId,
      password,
      waiterId: role === "waiter" ? waiterId : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// Get all users except owners and admins
router.get("/all", async (req, res) => {
  try {
    const users = await User.find(
      { role: { $nin: ["owner", "admin"] } }, // exclude owner and admin
      { password: 0 } // exclude password
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/allmanager", async (req, res) => {
  try {
    const users = await User.find(
      { role: { $nin: ["owner", "admin", "manager"] } }, // exclude owner and admin
      { password: 0 } // exclude password
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// Fire user by ID and send email
router.delete("/fire/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove from database
    await User.findByIdAndDelete(userId);

    const htmlContent = getFireEmailHTML({firstName : user.firstName});
    // Send email
    const mailOptions = {
      from: process.env.RESTAURANT_EMAIL,
      to: user.email,
      subject: "You have been fired",
      html: htmlContent,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: "User fired and email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Manual comparison
    if (user.password !== oldPassword) {
      return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }

    user.password = newPassword; // simply overwrite
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




const getRoleEmailHTML = ({ role, firstName, userId, password, waiterId }) => {
  let roleMessage = "";

  if (role === "waiter") {
    roleMessage = `
      <p>You are hired as a <b>Waiter</b>.</p>
      <p>Shared Login:</p>
      <p><b>Username:</b> ${userId}<br><b>Password:</b> ${password}</p>
      <p>Your personal Waiter ID: ${waiterId}<br><small>(For internal tracking only)</small></p>
    `;
  } else if (role === "chef") {
    roleMessage = `
      <p>Your <b>Chef</b> login:</p>
      <p><b>Username:</b> ${userId}<br><b>Password:</b> ${password}</p>
    `;
  } else {
    roleMessage = `
      <p>Your login credentials:</p>
      <p><b>Username:</b> ${userId}<br><b>Password:</b> ${password}</p>
    `;
  }

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Welcome to Grill Genius</title>
  </head>
  <body style="margin:0;padding:0;font-family:'Playfair Display', serif;background-color:#1d1d1d;color:#f1faee;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1d1d1d;padding:40px 0;">
      <tr>
        <td align="center">
          <!-- Logo -->
          <div style="margin-bottom: 2rem;">
      <span style="font-size: 5rem; font-weight: 900; color: #e63946; letter-spacing: -10px;">G</span>
      <span style="font-size: 5rem; font-weight: 900; color: #ffd166; letter-spacing: -10px; transform: rotate(-10deg); margin-left: -15px; text-shadow: 0 0 15px rgba(255, 209, 102, 0.5);">G</span>
    </div>

          <!-- Title -->
          <h1 style="font-family:'Playfair Display', serif;font-size:36px;font-weight:700;color:#f1faee;margin:20px 0 10px 0;">Grill Genius</h1>

          <!-- Greeting -->
          <p style="max-width:600px;font-size:18px;line-height:1.6;color:#f8f9fa;margin:10px 0 30px 0;">
            Hello <b style="color:#ffd166;">${firstName}</b>, welcome to our team! 🔥
          </p>

          <!-- Role-specific message box -->
          <table cellpadding="10" cellspacing="0" style="background-color:#2b2b2b;border-radius:10px;max-width:500px;width:100%;color:#fff;">
            <tr>
              <td>${roleMessage}</td>
            </tr>
          </table>

          <!-- Thank you -->
          <p style="margin-top:30px;font-size:16px;color:#ffd166;">
            Thank you for joining <b>Grill Genius</b>!
          </p>

          <!-- Login button -->
          <a href="/login" style="display:inline-block;margin-top:20px;padding:12px 25px;background-color:#e63946;color:#fff;text-decoration:none;border-radius:30px;box-shadow:0 4px 10px rgba(230,57,70,0.3);font-weight:600;">
            Login to Your Account
          </a>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};


const getFireEmailHTML = ({firstName}) => {
  return `
  <div style="font-family: 'Playfair Display', serif; background: linear-gradient(180deg, #1d1d1d 0%, #2b2b2b 100%);
              color: #f1faee; padding: 2rem; text-align: center; min-height: 100vh;">
    
    <div style="margin-bottom: 2rem;">
      <span style="font-size: 5rem; font-weight: 900; color: #e63946; letter-spacing: -10px;">G</span>
      <span style="font-size: 5rem; font-weight: 900; color: #ffd166; letter-spacing: -10px; transform: rotate(-10deg); margin-left: -15px; text-shadow: 0 0 15px rgba(255, 209, 102, 0.5);">G</span>
    </div>

    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Grill Genius</h1>

    <p style="font-size: 1.2rem; line-height: 1.6; max-width: 600px; margin: 1rem auto;">
      Hello <b>${firstName}</b>,
    </p>

    <p style="font-size: 1.1rem; line-height: 1.6; max-width: 600px; margin: 1rem auto; color: #ff4d4d;">
      You have been removed from the Grill Genius system and no longer have access to your account.
    </p>

    <p style="font-size: 1.1rem; margin-top: 2rem; color: #f1faee;">
      Thank you for your time with us, and we wish you the best in your future endeavors.
    </p>

    <div style="margin-top: 3rem;">
      <span style="font-size: 2rem; color: #e63946;">🔥</span>
    </div>

    <p style="margin-top: 1rem; font-size: 0.9rem; color: #aaa;">Grill Genius Team</p>
  </div>
  `;
}






export default router;

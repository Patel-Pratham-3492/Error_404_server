import express from "express";
import Reservation from "./models/Reservation.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, people, date, status = "pending" } = req.body;

    if (!name || !email || !people || !date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanDate = date.replace(/[/:-]/g, "");

    const randomDigits = Math.floor(100 + Math.random() * 900);
    const reservationId = name.substring(0, 3).toUpperCase() + randomDigits + cleanDate;

    // Save reservation with STATUS
    const newReservation = new Reservation({
      reservationId,
      name,
      email,
      people,
      date: cleanDate,
      status,     // 👈 SAVE STATUS
    });

    await newReservation.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.RESTAURANT_EMAIL,
        pass: process.env.RESTAURANT_EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Grill Genius" <${process.env.RESTAURANT_EMAIL}>`,
      to: email,
      subject: "Your Reservation Confirmation",
      html: `
        <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Reservation Confirmation</title>
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
          <h1 style="font-size:36px;margin:20px 0 10px 0;color:#f1faee;">Grill Genius</h1>

          <!-- Description -->
          <p style="max-width:600px;font-size:18px;line-height:1.6;color:#f8f9fa;margin:10px 0 30px 0;">
            Hello <b style="color:#ffd166;">${name}</b>, your reservation has been successfully created! 🔥
          </p>

          <!-- Reservation Details Box -->
          <table cellpadding="10" cellspacing="0" style="background-color:#2b2b2b;border-radius:10px;max-width:500px;width:100%;color:#fff;">
            <tr>
              <td><b>Date:</b></td>
              <td>${cleanDate}</td>
            </tr>
            <tr>
              <td><b>People:</b></td>
              <td>${people}</td>
            </tr>
            <tr>
              <td><b>Status:</b></td>
              <td style="color:#00ff2a;">${status}</td>
            </tr>
            <tr>
              <td><b>Reservation ID:</b></td>
              <td>${reservationId}</td>
            </tr>
          </table>

          <!-- Thank you -->
          <p style="margin-top:30px;font-size:16px;color:#ffd166;">
            Thank you for choosing <b>Grill Genius</b>!
          </p>

          <!-- Button -->
          <a href="/login" style="display:inline-block;margin-top:20px;padding:12px 25px;background-color:#e63946;color:#fff;text-decoration:none;border-radius:30px;box-shadow:0 4px 10px rgba(230,57,70,0.3);font-weight:600;">
            Login to Your Account
          </a>
        </td>
      </tr>
    </table>
  </body>
</html>

      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email response:", info.response);

      if (info.response.startsWith("250")) {
        return res.json({ success: true, message: "Reservation saved & email sent" });
      } else {
        await Reservation.deleteOne({ reservationId });
        return res.status(500).json({ success: false, message: "Failed to send confirmation email. Please try again." });
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      await Reservation.deleteOne({ reservationId });

      return res.status(500).json({ success: false, message: "Failed to send confirmation email. Please try again." });
    }

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create reservation. Please try again.",
    });
  }
});


router.get("/today", async (req, res) => {
  try {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const todayString = `${year}${month}${day}`; // "20251120"

    const reservations = await Reservation.find({ date: todayString }).sort({ createdAt: -1 });

    return res.json({ success: true, reservations });

  } catch (error) {
    console.error("ERROR fetching today's reservations:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reservations" });
  }
});

router.put("/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status required" });
    }

    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    return res.json({ success: true, updated });

  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
});


export default router;

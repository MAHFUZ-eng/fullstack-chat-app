import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

export const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const mailOptions = {
            from: `"NexoChat" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "Verify your email",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4F46E5; letter-spacing: 5px;">${verificationCode}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Error sending verification email");
    }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const mailOptions = {
            from: `"NexoChat" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "Reset your password",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password</h2>
          <p>You requested a password reset. Use the code below to reset it:</p>
          <h1 style="color: #EF4444; letter-spacing: 5px;">${resetToken}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Error sending password reset email");
    }
};

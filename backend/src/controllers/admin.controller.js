import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("fullName email createdAt securityQuestion")
            .sort({ createdAt: -1 });

        const usersWithStatus = users.map(user => ({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
            hasSecurityQuestion: !!user.securityQuestion
        }));

        res.status(200).json(usersWithStatus);
    } catch (error) {
        console.log("Error in getAllUsers:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const resetUserPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            message: `Password reset successfully for ${user.email}`,
            user: {
                email: user.email,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.log("Error in resetUserPassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

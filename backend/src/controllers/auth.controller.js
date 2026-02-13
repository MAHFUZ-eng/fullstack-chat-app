import { generateToken } from "../lib/utlis.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email.js";
import crypto from "crypto";

export const signup = async (req, res) => {
  const { fullName, email, password, securityQuestion, securityAnswer } = req.body;
  try {
    if (!fullName || !email || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), salt);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedAnswer,
    });

    if (newUser) {
      await newUser.save();

      // Generate token and log user in immediately
      generateToken(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is deleted and handle auto-restoration
    if (user.isDeleted) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (user.deletedAt && user.deletedAt >= sevenDaysAgo) {
        // Auto-restore account
        user.isDeleted = false;
        user.deletedAt = null;
        await user.save();
        console.log(`✅ Account automatically restored for user: ${user.email}`);
      } else {
        // Permanent deletion (outside grace period)
        return res.status(403).json({
          message: "Your account deletion grace period has expired. Please contact support.",
          isDeleted: true,
          deletedAt: user.deletedAt
        });
      }
    }

    const token = generateToken(user._id, res);

    // Update last active
    user.lastActive = new Date();
    await user.save();

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateEmailVisibility = async (req, res) => {
  try {
    const { emailVisibility } = req.body;
    const userId = req.user._id;

    // Validate email visibility value
    const validOptions = ["everyone", "friends_only", "only_me"];
    if (!validOptions.includes(emailVisibility)) {
      return res.status(400).json({ message: "Invalid email visibility option" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { emailVisibility },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update email visibility:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Soft delete: Mark account as deleted with timestamp
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      message: "Account marked for deletion. You have 7 days to recover your account.",
      deletedAt: user.deletedAt
    });
  } catch (error) {
    console.log("Error in deleteAccount controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const restoreAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email (including deleted ones)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is deleted
    if (!user.isDeleted) {
      return res.status(400).json({ message: "Account is not deleted" });
    }

    // Check if 7 days have passed
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (user.deletedAt < sevenDaysAgo) {
      return res.status(400).json({ message: "Account deletion period has expired. Cannot restore." });
    }

    // Restore account
    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    // Generate token
    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token,
      message: "Account restored successfully"
    });
  } catch (error) {
    console.log("Error in restoreAccount controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const user = await User.findById(currentUserId);

    if (user.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    user.blockedUsers.push(userId);
    await user.save();

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.log("Error in blockUser: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);

    if (!user.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.log("Error in unblockUser: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findOne({
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token,
    });
  } catch (error) {
    console.log("Error in verifyEmail controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has security question set
    if (!user.securityQuestion || !user.securityAnswer) {
      return res.status(400).json({ 
        message: "This account was created before security questions were added. Please contact support or create a new account." 
      });
    }


    // If no answer provided, return the security question
    if (!securityAnswer) {
      return res.status(200).json({
        securityQuestion: user.securityQuestion
      });
    }

    // Verify security answer
    const isAnswerCorrect = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);

    if (!isAnswerCorrect) {
      return res.status(400).json({ message: "Incorrect security answer" });
    }

    // If answer is correct and new password provided, reset password
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.status(200).json({ message: "Password reset successfully" });
    }

    // Answer is correct, allow user to reset password
    res.status(200).json({ message: "Security answer verified" });
  } catch (error) {
    console.log("Error in forgotPassword controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { code, newPassword } = req.body;

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Error in resetPassword controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


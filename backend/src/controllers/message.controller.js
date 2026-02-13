import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = new mongoose.Types.ObjectId(req.user._id);
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    const usersWithPrivacy = filteredUsers.map(user => {
      const userObj = user.toObject();
      const isFriend = req.user.friends.some(friendId => friendId.toString() === user._id.toString());

      if (user.emailVisibility === "only_me") {
        userObj.email = null;
      } else if (user.emailVisibility === "friends_only" && !isFriend) {
        userObj.email = null;
      }
      return userObj;
    });

    res.status(200).json(usersWithPrivacy);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = new mongoose.Types.ObjectId(req.user._id);
    const userToChatIdObj = new mongoose.Types.ObjectId(userToChatId);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatIdObj },
        { senderId: userToChatIdObj, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio } = req.body;
    const { id: receiverId } = req.params;
    const senderId = new mongoose.Types.ObjectId(req.user._id);
    const receiverIdObj = new mongoose.Types.ObjectId(receiverId);

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "video" });
      audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId: receiverIdObj,
      text,
      image: imageUrl,
      audioUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = new mongoose.Types.ObjectId(req.user._id);
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Delete all messages between the two users
    const result = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userIdObj },
        { senderId: userIdObj, receiverId: myId },
      ],
    });

    res.status(200).json({
      message: "Chat deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.log("Error in deleteChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.emoji = emoji;
    } else {
      // Add new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Emit socket event for real-time update
    const receiverId = message.receiverId || message.groupId;
    if (receiverId) {
      const receiverSocketId = getReceiverSocketId(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReaction", {
          messageId,
          userId,
          emoji,
        });
      }
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in reactToMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove user's reaction
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    await message.save();

    // Emit socket event for real-time update
    const io = req.app.get("io");
    const receiverId = message.receiverId || message.groupId;
    if (receiverId) {
      io.to(receiverId.toString()).emit("messageReaction", {
        messageId,
        userId,
        emoji: null, // null indicates removal
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in removeReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message for me only
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Add userId to deletedFor array if not already there
    if (!message.deletedFor) {
      message.deletedFor = [];
    }

    if (!message.deletedFor.includes(userId.toString())) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.status(200).json({ message: "Message deleted for you", messageId });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unsend message (delete for everyone)
export const unsendMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    // Emit socket event for real-time update
    const receiverId = message.receiverId || message.groupId;
    if (receiverId) {
      const receiverSocketId = getReceiverSocketId(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageUnsent", { messageId });
      }
    }
    // Also emit to sender
    const senderSocketId = getReceiverSocketId(userId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageUnsent", { messageId });
    }

    res.status(200).json({ message: "Message unsent successfully", messageId });
  } catch (error) {
    console.log("Error in unsendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
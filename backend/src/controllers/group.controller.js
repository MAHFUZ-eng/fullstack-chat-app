import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const createGroup = async (req, res) => {
    try {
        const { name, members } = req.body;
        const adminId = req.user._id;

        if (!name || !members || members.length === 0) {
            return res.status(400).json({ message: "Name and members are required" });
        }

        // members is expected to be an array of user IDs
        const memberIds = members.map((id) => new mongoose.Types.ObjectId(id));

        // Add admin to members if not already present (optional, but good practice for "my groups" queries)
        if (!memberIds.some((id) => id.equals(adminId))) {
            memberIds.push(adminId);
        }

        const newGroup = new Group({
            name,
            admin: adminId,
            members: memberIds,
        });

        await newGroup.save();

        res.status(201).json(newGroup);
    } catch (error) {
        console.error("Error in createGroup:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId }).populate("members", "-password").sort({ updatedAt: -1 });

        const groupsWithPrivacy = groups.map(group => {
            const groupObj = group.toObject();
            groupObj.members = groupObj.members.map(member => {
                // If member is self, return as is
                if (member._id.toString() === userId.toString()) return member;

                const isFriend = req.user.friends.some(friendId => friendId.toString() === member._id.toString());

                if (member.emailVisibility === "only_me") {
                    member.email = null;
                } else if (member.emailVisibility === "friends_only" && !isFriend) {
                    member.email = null;
                }
                return member;
            });
            return groupObj;
        });

        res.status(200).json(groupsWithPrivacy);
    } catch (error) {
        console.error("Error in getGroups:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ groupId }).populate("senderId", "fullName profilePic");
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image, audio } = req.body;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
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
            groupId,
            text,
            image: imageUrl,
            audioUrl,
        });

        await newMessage.save();

        await newMessage.populate("senderId", "fullName profilePic");

        const group = await Group.findById(groupId);

        group.members.forEach((memberId) => {
            if (memberId.toString() === senderId.toString()) return;

            const receiverSocketId = getReceiverSocketId(memberId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendGroupMessage:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const renameGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Only members (or admin) can rename? Let's allow any member for now, or just admin.
        // User request: "group name can be changed anytime". Typically admin only, but let's be flexible or sticky to generic.
        // Let's allow any member to rename for simplicity unless specified.
        // But safer to check membership.
        if (!group.members.includes(userId)) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        group.name = name;
        await group.save();

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in renameGroup:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const addGroupMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body; // User to add
        const currentUserId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Only admin can add? Or any member? Standard is typically Admin.
        // Let's enforce Admin for adding/removing to avoid chaos.
        if (group.admin.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        if (group.members.includes(userId)) {
            return res.status(400).json({ message: "User is already a member" });
        }

        group.members.push(userId);
        await group.save();

        // Populate members to return updated group info
        await group.populate("members", "-password");

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in addGroupMember:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const removeGroupMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body; // User to remove
        const currentUserId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Only admin can remove?
        if (group.admin.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        // Admin cannot remove themselves via this route? Or can they?
        // If admin removes self, group might become admin-less.
        if (userId === group.admin.toString()) {
            return res.status(400).json({ message: "Admin cannot be removed. Transfer ownership first." });
        }

        group.members = group.members.filter(id => id.toString() !== userId);
        await group.save();

        // Populate members to return updated group info
        await group.populate("members", "-password");

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in removeGroupMember:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

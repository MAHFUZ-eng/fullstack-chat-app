import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import mongoose from "mongoose";

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user._id;

        if (!query) return res.status(200).json([]);

        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } },
                {
                    $or: [
                        { fullName: { $regex: query, $options: "i" } },
                        { email: { $regex: query, $options: "i" } },
                    ],
                },
            ],
        }).select("-password");

        // Check friend status for each user
        const usersWithStatus = await Promise.all(
            users.map(async (user) => {
                const friendRequest = await FriendRequest.findOne({
                    $or: [
                        { sender: currentUserId, receiver: user._id },
                        { sender: user._id, receiver: currentUserId },
                    ],
                    status: "pending",
                });

                const isFriend = req.user.friends.includes(user._id);

                // Wait, req.user might not have populated friends yet if not populated in middleware
                // But for check, simple ID check is enough if friends is array of IDs.
                // Assuming req.user from auth middleware has updated friends list. 
                // If auth middleware fetches user without populating, friends is just IDs.

                let status = "none";
                if (isFriend) {
                    status = "friend";
                } else if (friendRequest) {
                    status = friendRequest.sender.toString() === currentUserId.toString() ? "sent" : "received";
                }

                return { ...user.toObject(), requestStatus: status, requestId: friendRequest?._id };
            })
        );

        res.status(200).json(usersWithStatus);
    } catch (error) {
        console.error("Error in searchUsers: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user._id;

        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself" });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
            status: "pending",
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already pending" });
        }

        const alreadyFriends = await User.findOne({
            _id: senderId,
            friends: receiverId
        });

        if (alreadyFriends) {
            return res.status(400).json({ message: "You are already friends" });
        }

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId,
        });

        await newRequest.save();

        res.status(201).json({ message: "Friend request sent", request: newRequest });
    } catch (error) {
        console.error("Error in sendFriendRequest: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await FriendRequest.find({
            receiver: userId,
            status: "pending"
        }).populate("sender", "fullName email profilePic");

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getFriendRequests: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (request.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to accept this request" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request is already processed" });
        }

        request.status = "accepted";
        await request.save();

        // Add to both users' friend lists
        await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
        await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

        res.status(200).json({ message: "Friend request accepted" });

    } catch (error) {
        console.error("Error in acceptFriendRequest: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (request.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to reject this request" });
        }

        // We can either delete it or mark as rejected. Deleting is cleaner for re-requests later.
        // But plan said "mark as rejected or delete". I'll delete it to allow future requests.
        await FriendRequest.findByIdAndDelete(requestId);

        res.status(200).json({ message: "Friend request rejected" });

    } catch (error) {
        console.error("Error in rejectFriendRequest: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("friends", "-password");
        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getFriends: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";

import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

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

        // Check friend status and apply email privacy for each user
        const usersWithStatus = await Promise.all(
            users.map(async (user) => {
                const friendRequest = await FriendRequest.findOne({
                    $or: [
                        { sender: currentUserId, receiver: user._id },
                        { sender: user._id, receiver: currentUserId },
                    ],
                    status: "pending",
                });

                const isFriend = Array.isArray(req.user.friends) && req.user.friends.some(friendId => friendId.toString() === user._id.toString());

                let status = "none";
                if (isFriend) {
                    status = "friend";
                } else if (friendRequest) {
                    status = friendRequest.sender.toString() === currentUserId.toString() ? "sent" : "received";
                }

                const userObj = user.toObject();

                // Apply Email Privacy Logic
                if (user.emailVisibility === "only_me") {
                    delete userObj.email;
                } else if (user.emailVisibility === "friends_only") {
                    if (!isFriend) {
                        delete userObj.email;
                    }
                }

                return { ...userObj, requestStatus: status, requestId: friendRequest?._id };
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

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newFriendRequest", newRequest);
        }

        res.status(201).json({ message: "Friend request sent", request: newRequest });
    } catch (error) {
        console.error("Error in sendFriendRequest: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get received requests (where user is the receiver)
        const receivedRequests = await FriendRequest.find({
            receiver: userId,
            status: "pending"
        }).populate("sender", "fullName email profilePic emailVisibility");

        // Get sent requests (where user is the sender)
        const sentRequests = await FriendRequest.find({
            sender: userId,
            status: "pending"
        }).populate("receiver", "fullName email profilePic emailVisibility");

        const sanitizeRequest = (req, isSender) => {
            const reqObj = req.toObject();
            const target = isSender ? reqObj.sender : reqObj.receiver;

            // If I am the sender, I am looking at the receiver. Checking receiver's privacy.
            // If I am the receiver, I am looking at the sender. Checking sender's privacy.

            // For friend requests, usually we want to know who it is. 
            // But if "only_me" is strictly "only me", then email should be hidden.
            // If "friends_only", we are NOT friends yet (pending), so hide it.

            if (target.emailVisibility === "only_me" || target.emailVisibility === "friends_only") {
                target.email = null;
            }
            return reqObj;
        };

        res.status(200).json({
            received: receivedRequests.map(r => sanitizeRequest(r, false)),
            sent: sentRequests.map(r => sanitizeRequest(r, true))
        });
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

        const receiverSocketId = getReceiverSocketId(request.sender);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequestAccepted", {
                accepterName: req.user.fullName,
                accepterId: userId
            });
        }

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

        // Allow both receiver (rejecting) and sender (canceling) to delete the request
        const isReceiver = request.receiver.toString() === userId.toString();
        const isSender = request.sender.toString() === userId.toString();

        if (!isReceiver && !isSender) {
            return res.status(403).json({ message: "You are not authorized to delete this request" });
        }

        // We can either delete it or mark as rejected. Deleting is cleaner for re-requests later.
        // But plan said "mark as rejected or delete". I'll delete it to allow future requests.
        await FriendRequest.findByIdAndDelete(requestId);

        res.status(200).json({ message: isReceiver ? "Friend request rejected" : "Friend request cancelled" });

    } catch (error) {
        console.error("Error in rejectFriendRequest: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};



export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        res.status(200).json({ message: "Friend removed successfully" });
    } catch (error) {
        console.error("Error in removeFriend: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFriends = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const user = await User.findById(currentUserId).populate("friends", "-password");

        const friendsWithLastMessage = await Promise.all(
            user.friends.map(async (friend) => {
                const lastMessage = await Message.findOne({
                    $or: [
                        { senderId: currentUserId, receiverId: friend._id },
                        { senderId: friend._id, receiverId: currentUserId }
                    ]
                }).sort({ createdAt: -1 });

                const friendObj = friend.toObject();
                if (friend.emailVisibility === "only_me") {
                    friendObj.email = null;
                }

                return {
                    ...friendObj,
                    lastMessage: lastMessage ? {
                        text: lastMessage.text,
                        image: lastMessage.image,
                        audioUrl: lastMessage.audioUrl,
                        senderId: lastMessage.senderId,
                        createdAt: lastMessage.createdAt
                    } : null
                };
            })
        );

        // Sort friends by last message time (most recent first)
        friendsWithLastMessage.sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
            const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
            return dateB - dateA;
        });

        res.status(200).json(friendsWithLastMessage);
    } catch (error) {
        console.error("Error in getFriends: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

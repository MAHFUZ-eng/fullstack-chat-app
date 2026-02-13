import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquare, Check, X, UserX } from "lucide-react";
import { Link } from "react-router-dom";

const FriendsPage = () => {
    const {
        getFriends,
        getFriendRequests,
        users,
        receivedRequests,
        sentRequests,
        isFriendsLoading,
        setSelectedUser,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest
    } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const [activeTab, setActiveTab] = useState("friends"); // friends | received | sent

    useEffect(() => {
        getFriends();
        getFriendRequests();
    }, [getFriends, getFriendRequests]);

    if (isFriendsLoading) return (
        <div className="h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
        </div>
    );

    return (
        <div className="h-screen bg-base-100 pt-20 pb-20 overflow-y-auto">
            {/* Header */}
            <div className="px-4 mb-4">
                <h1 className="text-2xl font-bold">Friends</h1>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-200 mx-4 mb-4">
                <a
                    className={`tab ${activeTab === "friends" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("friends")}
                >
                    Friends ({users.length})
                </a>
                <a
                    className={`tab ${activeTab === "received" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("received")}
                >
                    Received ({receivedRequests.length})
                </a>
                <a
                    className={`tab ${activeTab === "sent" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("sent")}
                >
                    Sent ({sentRequests.length})
                </a>
            </div>

            {/* Tab Content */}
            <div className="flex flex-col">
                {/* Friends Tab */}
                {activeTab === "friends" && (
                    <>
                        {users.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500">
                                <p>No friends yet.</p>
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user._id} className="flex items-center gap-3 p-4 hover:bg-base-200 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                                    <div className="relative">
                                        <img
                                            src={user.profilePic || "/avatar.png"}
                                            alt={user.fullName}
                                            className="size-12 object-cover rounded-full"
                                        />
                                        {onlineUsers.includes(user._id) && (
                                            <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base">{user.fullName}</h3>
                                        <p className="text-sm text-zinc-500">{user.email}</p>
                                    </div>

                                    <Link to="/" className="btn btn-circle btn-ghost btn-sm" onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUser(user);
                                    }}>
                                        <MessageSquare className="size-5 text-primary" />
                                    </Link>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Received Requests Tab */}
                {activeTab === "received" && (
                    <>
                        {receivedRequests.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500">
                                <p>No incoming friend requests.</p>
                            </div>
                        ) : (
                            receivedRequests.map((request) => (
                                <div key={request._id} className="flex items-center gap-3 p-4 hover:bg-base-200 transition-colors">
                                    <div className="relative">
                                        <img
                                            src={request.sender?.profilePic || "/avatar.png"}
                                            alt={request.sender.fullName}
                                            className="size-12 object-cover rounded-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base">{request.sender?.fullName || "Unknown User"}</h3>
                                        <p className="text-sm text-zinc-500">{request.sender?.email || ""}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-success btn-sm btn-circle"
                                            onClick={() => acceptFriendRequest(request._id)}
                                        >
                                            <Check className="size-4" />
                                        </button>
                                        <button
                                            className="btn btn-error btn-sm btn-circle"
                                            onClick={() => rejectFriendRequest(request._id)}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Sent Requests Tab */}
                {activeTab === "sent" && (
                    <>
                        {sentRequests.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500">
                                <p>No outgoing friend requests.</p>
                            </div>
                        ) : (
                            sentRequests.map((request) => (
                                <div key={request._id} className="flex items-center gap-3 p-4 hover:bg-base-200 transition-colors">
                                    <div className="relative">
                                        <img
                                            src={request.receiver?.profilePic || "/avatar.png"}
                                            alt={request.receiver.fullName}
                                            className="size-12 object-cover rounded-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base">{request.receiver?.fullName || "Unknown User"}</h3>
                                        <p className="text-sm text-zinc-500">Pending</p>
                                    </div>

                                    <button
                                        className="btn btn-error btn-sm"
                                        onClick={() => cancelFriendRequest(request._id)}
                                    >
                                        <UserX className="size-4" />
                                        Cancel
                                    </button>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FriendsPage;

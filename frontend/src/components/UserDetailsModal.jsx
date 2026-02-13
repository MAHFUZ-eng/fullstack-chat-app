import React from "react";
import { useChatStore } from "../store/useChatStore";
import { X, UserMinus, UserPlus, MessageSquare } from "lucide-react";

const UserDetailsModal = ({ onClose }) => {
    const { selectedUser, removeFriend, users, sendFriendRequest } = useChatStore();

    if (!selectedUser) return null;

    console.log("UserDetailsModal rendering for:", selectedUser.fullName);

    const handleRemoveFriend = async () => {
        if (window.confirm(`Are you sure you want to remove ${selectedUser.fullName} from friends?`)) {
            await removeFriend(selectedUser._id);
            onClose();
        }
    };

    const isFriend = users.some(u => u._id === selectedUser._id);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 transition-opacity"
                onClick={onClose}
            />

            {/* Modal/Sheet */}
            <div className="bg-base-100 w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl border-t-2 border-base-300 overflow-hidden relative transform transition-all z-10 animate-in slide-in-from-bottom duration-300 pb-safe">

                {/* Mobile Handle */}
                <div className="w-12 h-1.5 bg-base-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

                {/* Header Image */}
                <div className="h-32 bg-primary/20 w-full relative">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 btn btn-circle btn-sm bg-base-200 hover:bg-base-300 text-base-content"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="px-6 pb-8 text-center -mt-16 relative">
                    {/* Avatar */}
                    <div className="relative inline-block">
                        <img
                            src={selectedUser.profilePic || "/avatar.png"}
                            alt={selectedUser.fullName}
                            className="size-32 rounded-full object-cover border-4 border-base-100 shadow-lg bg-base-100"
                        />
                        {/* Status Dot */}
                        {/* We can add status dot here if needed, but keeping it clean for now */}
                    </div>

                    {/* User Info */}
                    <h2 className="text-2xl font-bold mt-4 mb-1 text-base-content">{selectedUser.fullName}</h2>
                    <p className="text-base-content/60 mb-6">{selectedUser.email}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-base-200 rounded-xl">
                            <p className="text-xs text-base-content/60 uppercase font-bold">Member Since</p>
                            <p className="font-medium text-sm text-base-content">
                                {new Date(selectedUser.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="p-3 bg-base-200 rounded-xl">
                            <p className="text-xs text-base-content/60 uppercase font-bold">Status</p>
                            <p className="font-medium text-sm capitalize text-base-content">Active</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {isFriend ? (
                            <button
                                onClick={handleRemoveFriend}
                                className="btn btn-error btn-outline w-full flex items-center gap-2 rounded-xl"
                            >
                                <UserMinus className="size-5" />
                                Remove Friend
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    sendFriendRequest(selectedUser._id);
                                    onClose();
                                }}
                                className="btn btn-primary w-full flex items-center gap-2 rounded-xl"
                            >
                                <UserPlus className="size-5" />
                                Add Friend
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="btn btn-ghost w-full rounded-xl text-base-content"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;

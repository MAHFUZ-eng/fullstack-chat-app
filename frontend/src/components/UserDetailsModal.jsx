import React from "react";
import { useChatStore } from "../store/useChatStore";
import { X, UserMinus } from "lucide-react";

const UserDetailsModal = ({ onClose }) => {
    const { selectedUser, removeFriend } = useChatStore();

    if (!selectedUser) return null;

    const handleRemoveFriend = async () => {
        if (window.confirm(`Are you sure you want to remove ${selectedUser.fullName} from friends?`)) {
            await removeFriend(selectedUser._id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">

                {/* Header Image / Pattern */}
                <div className="h-24 bg-primary/10"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 btn btn-circle btn-ghost btn-sm text-base-content/50 hover:bg-base-200"
                >
                    <X className="size-5" />
                </button>

                <div className="px-6 pb-8 text-center -mt-12">
                    {/* Avatar */}
                    <div className="relative inline-block">
                        <img
                            src={selectedUser.profilePic || "/avatar.png"}
                            alt={selectedUser.fullName}
                            className="size-24 rounded-full object-cover border-4 border-base-100 shadow-lg"
                        />
                    </div>

                    {/* User Info */}
                    <h2 className="text-2xl font-bold mt-4 mb-1">{selectedUser.fullName}</h2>
                    <p className="text-base-content/60 mb-6">{selectedUser.email}</p>

                    <div className="w-full h-px bg-base-200 mb-6"></div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleRemoveFriend}
                            className="btn btn-error btn-outline w-full flex items-center gap-2"
                        >
                            <UserMinus className="size-5" />
                            Remove Friend
                        </button>
                        <button
                            onClick={onClose}
                            className="btn btn-ghost w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;

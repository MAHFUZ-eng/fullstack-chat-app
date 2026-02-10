import React, { useState } from "react";
import { X, Info, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import GroupDetailsModal from "./GroupDetailsModal";
import UserDetailsModal from "./UserDetailsModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  if (selectedGroup) {
    return (
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          {/* Clickable Header for Details */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowDetailsModal(true)}>
            {/* Group Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedGroup.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Group info */}
            <div>
              <h3 className="font-medium">{selectedGroup.name}</h3>
              <p className="text-sm text-base-content/70">
                {selectedGroup.members.length} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowDetailsModal(true)}>
              <Info className="size-5" />
            </button>
            {/* Close button */}
            <button onClick={handleClose}>
              <ArrowLeft className="size-5 lg:hidden" />
              <X className="size-5 hidden lg:block" />
            </button>
          </div>
        </div>

        {showDetailsModal && (
          <GroupDetailsModal onClose={() => setShowDetailsModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowUserDetailsModal(true)}>
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={handleClose}>
          <ArrowLeft className="size-5 lg:hidden" />
          <X className="size-5 hidden lg:block" />
        </button>
      </div>

      {showUserDetailsModal && (
        <UserDetailsModal onClose={() => setShowUserDetailsModal(false)} />
      )}
    </div>
  );
};
export default ChatHeader;
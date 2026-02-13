import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreVertical, Phone, Search, Video, RefreshCcw, Ban, Trash2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import GroupDetailsModal from "./GroupDetailsModal";
import UserDetailsModal from "./UserDetailsModal";
import { motion, AnimatePresence } from "framer-motion";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup, typingUsers, getMessages, getGroupMessages, deleteChat, blockUser, unblockUser } = useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const tapTimeoutRef = React.useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const handleDeleteChat = async () => {
    if (selectedUser) await deleteChat(selectedUser._id);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleBlockUser = async () => {
    if (selectedUser) await blockUser(selectedUser._id);
    setShowBlockConfirm(false);
    setShowMenu(false);
  };

  const handleUnblockUser = async () => {
    if (selectedUser) await unblockUser(selectedUser._id);
    setShowMenu(false);
  };

  const isUserBlocked = authUser?.blockedUsers?.includes(selectedUser?._id);

  const handleRefresh = () => {
    if (selectedUser) getMessages(selectedUser._id);
    if (selectedGroup) getGroupMessages(selectedGroup._id);

    setTapCount(prev => prev + 1);
    clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 500);

    if (tapCount === 2) {
      setShowDebug(prev => !prev);
      setTapCount(0);
    }
  };

  const formatLastSeen = (date) => {
    if (!date) return "Offline";
    const lastSeenDate = new Date(date);
    return `Last seen ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isTyping = selectedUser && typingUsers[selectedUser._id];
  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);

  const getStatusText = () => {
    if (selectedGroup) return `${selectedGroup.members.length} members`;
    if (isTyping) return <span className="text-primary font-bold animate-pulse">Typing...</span>;
    if (isOnline) return <span className="text-success font-bold flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success animate-pulse" /> Online</span>;
    if (selectedUser?.lastActive) return formatLastSeen(selectedUser.lastActive);
    return "Offline";
  };

  return (
    <div className="px-4 py-2 border-b border-base-300 w-full bg-base-100 sticky top-0 z-50 pt-safe">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleClose} className="lg:hidden btn btn-sm btn-circle btn-ghost hover:bg-base-200">
            <ArrowLeft className="size-5" />
          </button>

          <div onClick={() => selectedGroup ? setShowGroupDetails(true) : setShowUserDetails(true)} className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="size-11 rounded-2xl overflow-hidden shadow-lg shadow-base-content/5 border-2 border-base-100 transition-transform group-hover:scale-105">
                {selectedGroup ? (
                  <div className="bg-primary/10 flex items-center justify-center text-primary font-black text-lg w-full h-full">
                    {selectedGroup.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <img src={selectedUser?.profilePic || "/avatar.png"} alt={selectedUser?.fullName} className="w-full h-full object-cover" />
                )}
              </div>
              {!selectedGroup && isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-4 border-base-100 rounded-full shadow-sm"></div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base-content tracking-tight leading-none mb-1.5 truncate">
                {selectedUser?.fullName || selectedGroup?.name || "User"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-base-content/40 flex items-center gap-1.5">
                {getStatusText()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary transition-colors">
              <Search className="size-4" />
            </button>
            <button className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary transition-colors">
              <Video className="size-4" />
            </button>
            <button className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary transition-colors">
              <Phone className="size-4" />
            </button>
          </div>

          <button className="btn btn-ghost btn-circle btn-sm">
            <Search className="size-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button className="btn btn-ghost btn-circle btn-sm" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical className="size-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-56 bg-base-100/80 backdrop-blur-2xl border border-base-300 rounded-[2rem] p-3 shadow-2xl z-50 overflow-hidden"
                >
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                    className="w-full px-4 py-3 rounded-2xl text-left hover:bg-error/10 flex items-center gap-3 text-error transition-colors"
                  >
                    <div className="size-8 rounded-xl bg-error/10 flex items-center justify-center">
                      <Trash2 className="size-4" />
                    </div>
                    <span className="font-bold text-sm">Delete Chat</span>
                  </button>

                  <div className="h-px bg-base-300/50 my-1 mx-2" />

                  {isUserBlocked ? (
                    <button
                      onClick={handleUnblockUser}
                      className="w-full px-4 py-3 rounded-2xl text-left hover:bg-success/10 flex items-center gap-3 text-success transition-colors"
                    >
                      <div className="size-8 rounded-xl bg-success/10 flex items-center justify-center">
                        <ShieldAlert className="size-4" />
                      </div>
                      <span className="font-bold text-sm">Unblock User</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowBlockConfirm(true); setShowMenu(false); }}
                      className="w-full px-4 py-3 rounded-2xl text-left hover:bg-warning/10 flex items-center gap-3 text-warning transition-colors"
                    >
                      <div className="size-8 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Ban className="size-4" />
                      </div>
                      <span className="font-bold text-sm">Block User</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {showGroupDetails && selectedGroup && (
          <GroupDetailsModal onClose={() => setShowGroupDetails(false)} />
        )}
        {showUserDetails && selectedUser && (
          <UserDetailsModal onClose={() => setShowUserDetails(false)} />
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-base-300/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-base-100 border border-base-300 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="size-20 rounded-[2rem] bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Delete Chat?</h3>
              <p className="text-sm text-base-content/60 font-medium mb-8">
                This will permanently delete all messages. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1 rounded-2xl font-bold bg-base-200 border-none" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn flex-1 rounded-2xl font-bold btn-error border-none" onClick={handleDeleteChat}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-base-300/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-base-100 border border-base-300 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="size-20 rounded-[2rem] bg-warning/10 flex items-center justify-center text-warning mx-auto mb-6">
                <Ban size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Block User?</h3>
              <p className="text-sm text-base-content/60 font-medium mb-8">
                {selectedUser?.fullName} will no longer be able to message you.
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1 rounded-2xl font-bold bg-base-200 border-none" onClick={() => setShowBlockConfirm(false)}>Cancel</button>
                <button className="btn flex-1 rounded-2xl font-bold btn-warning border-none" onClick={handleBlockUser}>Block</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatHeader;
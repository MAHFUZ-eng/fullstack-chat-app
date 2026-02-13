import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Users, Plus, Search, UserPlus, Check, X, ArrowLeft, Camera, MoreVertical, RefreshCcw, MessageSquare, Sparkles, User, LogOut } from "lucide-react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal.jsx";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const {
    getFriends,
    users,
    selectedUser,
    setSelectedUser,
    isFriendsLoading,
    getGroups,
    groups,
    selectedGroup,
    setSelectedGroup,
    isGroupsLoading,
    getFriendRequests,
    friendRequests,
    searchUsers,
    searchResults,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    isSearching,
    setSidebarSearchActive,
  } = useChatStore();

  const unreadCounts = useChatStore(state => state.unreadCounts) || {};
  const { onlineUsers, logout } = useAuthStore();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    getFriends();
    getGroups();
    getFriendRequests();
  }, [getFriends, getGroups, getFriendRequests]);

  useEffect(() => {
    setSidebarSearchActive(!!searchQuery);
    return () => setSidebarSearchActive(false);
  }, [searchQuery, setSidebarSearchActive]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchUsers(value);
  };

  const truncateText = (text, length = 30) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  const usersList = Array.isArray(users) ? users : [];
  const filteredUsers = usersList.filter((user) => {
    const name = user.fullName || "";
    const searchMatch = name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "unread") return searchMatch && unreadCounts[user._id] > 0;
    return searchMatch;
  });

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isFriendsLoading || isGroupsLoading) return <SidebarSkeleton />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <aside className={`h-full flex flex-col transition-all duration-300 w-full lg:w-full bg-base-100 ${(selectedUser || selectedGroup) ? "hidden lg:flex" : "flex"}`}>
      {/* Header Branding */}
      <div className="px-6 pt-safe pb-4 bg-base-100 border-b border-base-200 lg:border-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-content">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
                Nexo <Sparkles className="size-3.5 text-primary" />
              </h1>
              <p className="text-[9px] text-base-content/40 font-bold uppercase tracking-[0.15em] leading-none">Messages</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/profile" className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-primary transition-colors">
              <User className="size-4.5" />
            </Link>
            <button className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-error transition-colors" onClick={logout}>
              <LogOut className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group mb-3">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-base-content/20 group-focus-within:text-primary transition-colors">
            <Search className="size-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search people..."
            className="input w-full bg-base-200 border-none focus:bg-base-200/50 h-10 rounded-xl pl-11 pr-10 transition-all text-sm font-medium"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                searchUsers("");
              }}
              className="absolute inset-y-0 right-3 flex items-center text-base-content/30 hover:text-error transition-colors"
            >
              <X className="size-4.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 py-1">
          {["all", "unread", "groups"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                px-4 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all
                ${activeFilter === filter
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content/60 hover:bg-base-300"}
              `}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-4 pb-20 lg:pb-8 space-y-1"
        >
          {filteredUsers.length === 0 && searchQuery && searchResults.length === 0 && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center px-10"
            >
              <div className="size-16 rounded-3xl bg-base-200/50 flex items-center justify-center text-base-content/20 mb-4 animate-pulse">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold opacity-40">No people found</h3>
              <p className="text-xs opacity-30 mt-1 max-w-[200px]">Try searching for a different name or email.</p>
            </motion.div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-10">
              <span className="loading loading-ring loading-md text-primary opacity-50"></span>
            </div>
          )}

          <div className="space-y-1">
            {/* Friends / Direct Messages */}
            {(activeFilter === "all" || activeFilter === "unread" || (activeFilter === "all" && !searchQuery)) &&
              filteredUsers.map((user) => {
                const userIdStr = user._id?.toString();
                const isSelected = selectedUser?._id?.toString() === userIdStr;
                const isUnread = unreadCounts[userIdStr] > 0;

                return (
                  <motion.button
                    key={userIdStr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    layout
                    onClick={() => setSelectedUser(user)}
                    className={`
                      w-full p-4 flex items-center gap-4 rounded-2xl transition-all duration-300
                      ${isSelected ? "bg-primary text-primary-content shadow-xl shadow-primary/20 translate-x-1" : "hover:bg-base-200/50 active:scale-[0.98]"}
                    `}
                  >
                    <div className="relative shrink-0">
                      <div className={`p-0.5 rounded-full ${isUnread ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100" : ""}`}>
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName || "User"}
                          className="size-14 object-cover rounded-2xl shadow-md border border-base-300/10"
                        />
                      </div>
                      {onlineUsers.includes(userIdStr) && (
                        <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-success rounded-full ring-4 ring-base-100" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`font-bold text-[15px] truncate ${isSelected ? "text-primary-content" : "text-base-content"}`}>
                          {user.fullName || "Unknown User"}
                        </h3>
                        <span className={`text-[10px] font-bold ${isSelected ? "opacity-70" : (isUnread ? "text-primary" : "opacity-40")}`}>
                          {user.lastMessageTime ? formatTime(user.lastMessageTime) : (user.lastMessage?.createdAt ? formatTime(user.lastMessage.createdAt) : "")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className={`text-xs truncate font-medium flex-1 ${isSelected ? "text-primary-content/80" : (isUnread ? "text-base-content font-bold" : "text-base-content/40")}`}>
                          {typeof user.lastMessage === 'string'
                            ? user.lastMessage
                            : (user.lastMessage?.text || (user.lastMessage?.image ? "📷 Photo" : (user.lastMessage?.audioUrl ? "🎤 Audio" : "Start chatting!")))
                          }
                        </p>
                        {isUnread && (
                          <div className={`shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black ${isSelected ? "bg-white text-primary" : "bg-error text-white"} shadow-lg ring-2 ring-base-100 shadow-error/20`}>
                            {unreadCounts[userIdStr]}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })
            }

            {/* Groups Section */}
            {(activeFilter === "all" || activeFilter === "groups") && (
              <div className="space-y-1">
                {activeFilter === "all" && groups.length > 0 && <div className="px-6 py-2 text-[10px] font-black text-base-content/20 uppercase tracking-[0.2em] mt-2">Groups</div>}
                {groups
                  .filter(group => {
                    const name = group.name || "";
                    return name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((group) => {
                    const groupIdStr = group._id?.toString();
                    const isSelected = selectedGroup?._id?.toString() === groupIdStr;
                    const isUnread = unreadCounts[groupIdStr] > 0;
                    return (
                      <motion.button
                        key={groupIdStr}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        onClick={() => setSelectedGroup(group)}
                        className={`
                            w-full p-4 flex items-center gap-4 rounded-2xl transition-all duration-300
                            ${isSelected ? "bg-primary text-primary-content shadow-xl shadow-primary/20 translate-x-1" : "hover:bg-base-200/50 active:scale-[0.98]"}
                          `}
                      >
                        <div className="relative shrink-0">
                          <div className={`size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform ${isUnread ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100" : ""}`}>
                            <Users size={28} />
                          </div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className={`font-bold text-[15px] truncate ${isSelected ? "text-primary-content" : "text-base-content"}`}>
                              {group.name}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className={`text-xs truncate font-medium flex-1 ${isSelected ? "text-primary-content/80" : (isUnread ? "text-base-content font-bold" : "text-base-content/40")}`}>
                              {group.members?.length || 0} members
                            </p>
                            {isUnread && (
                              <div className={`shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black ${isSelected ? "bg-white text-primary" : "bg-error text-white"} shadow-lg ring-2 ring-base-100 shadow-error/20`}>
                                {unreadCounts[groupIdStr]}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            )}

            {/* Global Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="pt-6 space-y-1">
                <div className="px-6 py-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Global Discovery</div>
                {searchResults
                  .filter(res => {
                    const resId = res._id ? res._id.toString() : "";
                    const isAlreadyInList = usersList.some(u => u._id && u._id.toString() === resId);
                    return !isAlreadyInList;
                  })
                  .map(user => (
                    <motion.button
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                      onClick={() => setSelectedUser(user)}
                      className="w-full p-4 flex items-center gap-4 rounded-2xl hover:bg-base-200/50 transition-all active:scale-[0.98]"
                    >
                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName || "User"} className="size-14 object-cover rounded-2xl border border-base-300/10 shadow-sm" />
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="font-bold text-[15px] text-base-content">{user.fullName || "Global User"}</h3>
                        <p className="text-xs text-base-content/40 truncate font-medium">{user.email}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Plus className="size-5" />
                      </div>
                    </motion.button>
                  ))}
              </div>
            )}
          </div>
        </motion.div>
      </div >

      {/* Modern FAB */}
      < div className="fixed bottom-24 right-6 lg:hidden z-[60]" >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateGroupModal(true)}
          className="btn btn-circle btn-primary size-14 shadow-xl text-primary-content border-none"
        >
          <Plus className="size-7" />
        </motion.button>
      </div >

      <AnimatePresence>
        {showCreateGroupModal && (
          <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
        )}
      </AnimatePresence>
    </aside >
  );
};

export default Sidebar;
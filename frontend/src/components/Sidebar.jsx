import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Plus, Search, UserPlus, Check, X } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal.jsx";

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
    unreadCounts,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    getFriends();
    getGroups();
    getFriendRequests();
  }, [getFriends, getGroups, getFriendRequests]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      searchUsers(e.target.value);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Calculate unread counts map
  const unreadCounts = useChatStore(state => state.unreadCounts) || {};

  // Format time helper
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isFriendsLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside
      className={`
        h-full border-r border-base-300 flex flex-col transition-all duration-200
        w-full ${isSidebarOpen ? "lg:w-72" : "lg:w-20"}
        bg-base-100
      `}
    >
      {/* WhatsApp-style Header (Only visible on mobile or when open on desktop) */}
      <div className={`
          ${isSidebarOpen || "lg:block"} 
          ${!isSidebarOpen && "lg:hidden"}
          bg-base-100 pb-2
      `}>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold">Chatty</span>
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost btn-circle btn-sm"><Search className="size-5" /></button>
            {/* Desktop Toggle Button moved here for cleaner UI */}
            <button onClick={toggleSidebar} className="hidden lg:flex btn btn-ghost btn-circle btn-sm">
              {isSidebarOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          <button className="btn btn-xs rounded-full btn-active normal-case">All</button>
          <button className="btn btn-xs rounded-full btn-ghost bg-base-200 normal-case">Unread</button>
          <button className="btn btn-xs rounded-full btn-ghost bg-base-200 normal-case">Groups</button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-base-200 w-full mb-1"></div>

      <div className="overflow-y-auto w-full flex-1">
        {/* Search Results */}
        {searchQuery && (
          <div className="mb-4">
            {/* ... Search results logic (keep simplified) ... */}
            <div className="px-5 text-xs text-zinc-500 font-semibold mb-2 uppercase">Search Results</div>
            {/* ... (Search implementations) ... */}
          </div>
        )}

        {/* ... (Friend Requests logic) ... */}

        {/* Contacts (Friends) List - WhatsApp Style */}
        {!searchQuery && (
          <div className="flex flex-col">
            {filteredUsers.map((user) => {
              const lastMsg = user.lastMessage;
              const isUnread = unreadCounts[user._id] > 0;

              return (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`
                        w-full p-3 flex items-center gap-3
                        hover:bg-base-200 transition-colors
                        relative
                        ${selectedUser?._id === user._id ? "bg-base-200" : ""}
                    `}
                >
                  <div className="relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                            rounded-full ring-2 ring-white dark:ring-zinc-900"
                      />
                    )}
                  </div>

                  <div className={`flex-1 min-w-0 flex flex-col justify-center ${!isSidebarOpen && "lg:hidden"}`}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-base truncate">{user.fullName}</h3>
                      <span className={`text-xs ${isUnread ? "text-green-500 font-medium" : "text-zinc-500"}`}>
                        {lastMsg ? formatTime(lastMsg.createdAt) : ""}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-sm text-zinc-500 truncate pr-2 flex items-center gap-1">
                        {lastMsg?.senderId !== user._id && lastMsg && (
                          <Check className="size-3 text-blue-500 inline" />
                          // Dummy 'read' check for now, standard logic later
                        )}
                        {lastMsg ? (
                          lastMsg.text || (lastMsg.image ? "📷 Photo" : "🎤 Audio")
                        ) : (
                          <span className="italic text-xs">No messages yet</span>
                        )}
                      </p>

                      {isUnread && (
                        <span className="bg-green-500 text-white text-[10px] font-bold h-5 min-w-5 rounded-full flex items-center justify-center px-1">
                          {unreadCounts[user._id]}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <div className={`absolute bottom-6 right-6 lg:hidden ${searchQuery ? "hidden" : "block"}`}>
        <button
          onClick={() => setShowCreateGroupModal(true)} // Or open search for new chat
          className="btn btn-circle btn-primary size-14 shadow-lg text-white"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </aside>
  );
};
export default Sidebar;
```
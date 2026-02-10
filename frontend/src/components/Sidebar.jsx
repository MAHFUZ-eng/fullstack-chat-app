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
    isSearching
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

  if (isFriendsLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside
      className={`
        h-full border-r border-base-300 flex flex-col transition-all duration-200
        ${isSidebarOpen ? "w-72" : "w-20 lg:w-72"}
      `}
    >
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className={`font-medium ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Chats</span>
          </div>
          {/* Mobile Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden btn btn-circle btn-ghost btn-xs"
          >
            {isSidebarOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
        </div>

        {/* Search Bar */}
        <div className={`relative w-full ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="input input-sm input-bordered w-full pr-8"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="size-4 absolute right-2 top-2.5 text-zinc-400" />
          </div>
        </div>

        {/* Create Group Button (moved logic for compact view) */}
        {!isSidebarOpen && (
          <div className="lg:hidden flex justify-center mt-2">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="btn btn-ghost btn-xs btn-circle"
              title="Create Group"
            >
              <Plus className="size-5" />
            </button>
          </div>
        )}

        {/* Helper for large screen create group (when sidebar is inherently open) */}
        <div className="hidden lg:flex justify-end absolute top-5 right-5">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="btn btn-ghost btn-xs lg:btn-sm btn-circle"
            title="Create Group"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {/* Online filter toggle - Only for users (friends) */}
        {!searchQuery && (
          <div className={`mt-3 flex items-center gap-2 ${isSidebarOpen ? "flex" : "hidden lg:flex"}`}>
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-4">
            <div className={`px-5 text-xs text-zinc-500 font-semibold mb-2 uppercase ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Search Results</div>
            {isSearching ? (
              <div className="text-center text-zinc-500 py-4">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-zinc-500 py-4">No users found</div>
            ) : (
              searchResults.map((user) => (
                <div key={user._id} className="w-full p-3 flex items-center justify-between hover:bg-base-300 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-10 object-cover rounded-full"
                    />
                    <div className={`text-left min-w-0 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
                      <div className="font-medium truncate">{user.fullName}</div>
                    </div>
                  </div>

                  {user.requestStatus === 'friend' ? (
                    <span className={`text-xs text-green-500 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Friend</span>
                  ) : user.requestStatus === 'sent' ? (
                    <span className={`text-xs text-zinc-500 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Sent</span>
                  ) : user.requestStatus === 'received' ? (
                    <span className={`text-xs text-blue-500 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Received</span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(user._id)}
                      className="btn btn-ghost btn-xs btn-circle text-primary"
                      title="Add Friend"
                    >
                      <UserPlus className="size-5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Friend Requests */}
        {!searchQuery && friendRequests.length > 0 && (
          <div className="mb-4 border-b border-base-300 pb-2">
            <div className={`px-5 text-xs text-zinc-500 font-semibold mb-2 uppercase ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Friend Requests</div>
            {friendRequests.map((req) => (
              <div key={req._id} className="w-full p-3 flex items-center justify-between hover:bg-base-300 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={req.sender.profilePic || "/avatar.png"}
                    alt={req.sender.fullName}
                    className="size-10 object-cover rounded-full"
                  />
                  <div className={`text-left min-w-0 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
                    <div className="font-medium truncate">{req.sender.fullName}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => acceptFriendRequest(req._id)}
                    className="btn btn-ghost btn-xs btn-circle text-green-500"
                    title="Accept"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(req._id)}
                    className="btn btn-ghost btn-xs btn-circle text-red-500"
                    title="Reject"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Groups Section (Only show if not searching) */}
        {!searchQuery && groups.length > 0 && (
          <div className="mb-4">
            <div className={`px-5 text-xs text-zinc-500 font-semibold mb-2 uppercase ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Groups</div>
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => setSelectedGroup(group)}
                className={`
                        w-full p-3 flex items-center gap-3
                        hover:bg-base-300 transition-colors
                        ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                        `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className={`text-left min-w-0 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
                  <div className="font-medium truncate">{group.name}</div>
                  <div className="text-sm text-zinc-400">
                    {group.members.length} members
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Contacts (Friends) */}
        {!searchQuery && (
          <>
            <div className={`px-5 text-xs text-zinc-500 font-semibold mb-2 uppercase ${isSidebarOpen ? "block" : "hidden lg:block"}`}>Friends</div>

            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                    `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                        rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className={`text-left min-w-0 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">No friends added yet</div>
            )}
          </>
        )}
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </aside>
  );
};
export default Sidebar;
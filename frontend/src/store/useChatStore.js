import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  allUsers: [], // New state for modals to avoid polluting sidebar users
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ allUsers: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set({ groups: [res.data, ...get().groups] });
      toast.success("Group created successfully");
      return true;
    } catch (error) {
      toast.error(error.response.data.message);
      return false;
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages, users } = get();
    const authStore = useAuthStore.getState();
    const currentUserId = authStore.authUser?._id;

    // Create optimistic message (shown immediately)
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // Temporary ID
      senderId: currentUserId,
      receiverId: selectedUser?._id,
      text: messageData.text || "",
      image: messageData.image || null,
      audioUrl: messageData.audio || null,
      createdAt: new Date().toISOString(),
      status: "sending", // Custom status
      isOptimistic: true, // Flag to identify optimistic messages
    };

    // Immediately add to UI
    set({ messages: [...messages, optimisticMessage] });

    // Update users list optimistically - move to top and update last message
    if (selectedUser) {
      const updatedUsers = users.map(user => {
        if (user._id === selectedUser._id) {
          return {
            ...user,
            lastMessage: messageData.text || (messageData.image ? "📷 Photo" : "🎤 Voice message"),
            lastMessageTime: new Date().toISOString(),
          };
        }
        return user;
      });

      // Move the selected user to the top
      const selectedUserIndex = updatedUsers.findIndex(u => u._id === selectedUser._id);
      if (selectedUserIndex > 0) {
        const [userToMove] = updatedUsers.splice(selectedUserIndex, 1);
        updatedUsers.unshift(userToMove);
      }

      set({ users: updatedUsers });
    }

    try {
      let res;
      if (selectedUser) {
        res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      } else if (selectedGroup) {
        res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
      }

      // Replace optimistic message with real one from server
      set({
        messages: get().messages.map((msg) =>
          msg._id === optimisticMessage._id ? res.data : msg
        ),
      });
    } catch (error) {
      // Mark message as failed
      set({
        messages: get().messages.map((msg) =>
          msg._id === optimisticMessage._id
            ? { ...msg, status: "failed" }
            : msg
        ),
      });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  unreadCounts: {}, // { userId: count }

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      set((state) => {
        const { selectedUser, selectedGroup, messages, unreadCounts, users, groups, allUsers } = state;

        const senderIdStr = (typeof newMessage.senderId === "string" ? newMessage.senderId : newMessage.senderId?._id)?.toString();
        const groupIdStr = newMessage.groupId ? (typeof newMessage.groupId === "string" ? newMessage.groupId : newMessage.groupId?._id)?.toString() : null;

        const isChatOpen = (selectedUser && senderIdStr === selectedUser._id?.toString() && !groupIdStr) ||
          (selectedGroup && groupIdStr === selectedGroup._id?.toString());

        const authUser = useAuthStore.getState().authUser;
        const isFromMe = senderIdStr === authUser?._id?.toString();

        // 1. Play sound and show toast if not from me
        if (!isFromMe) {
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
            audio.play().catch(e => console.log("Audio play failed", e));
          } catch (e) { }

          if (!isChatOpen) {
            let senderName = "New Message";
            if (groupIdStr) {
              const group = groups.find(g => g._id?.toString() === groupIdStr);
              senderName = group ? `Group: ${group.name}` : "Group Message";
            } else {
              const user = users.find(u => u._id?.toString() === senderIdStr) ||
                allUsers.find(u => u._id?.toString() === senderIdStr);
              senderName = user ? user.fullName : "Somebody";
            }
            toast.success(`${senderName}: ${newMessage.text || "📷 Photo"}`, {
              duration: 4000,
              position: 'top-center',
              className: 'modern-toast',
            });
          }
        }

        // 2. Prepare updated lists and unread counts
        let newUsers = [...users];
        let newGroups = [...groups];
        let newUnreadCounts = { ...unreadCounts };

        const messageText = newMessage.text || (newMessage.image ? "📷 Photo" : (newMessage.audioUrl ? "🎤 Audio" : "New message"));

        if (!groupIdStr) {
          const userIndex = newUsers.findIndex(u => u._id?.toString() === senderIdStr);
          if (userIndex !== -1) {
            const user = { ...newUsers[userIndex], lastMessage: messageText, lastMessageTime: newMessage.createdAt };
            newUsers.splice(userIndex, 1);
            newUsers.unshift(user);
          } else if (!isFromMe) {
            // Add user from allUsers or use temporary data as fallback
            const existingUser = allUsers.find(u => u._id?.toString() === senderIdStr);
            const newUserObj = existingUser
              ? { ...existingUser, lastMessage: messageText, lastMessageTime: newMessage.createdAt }
              : { _id: senderIdStr, fullName: "New Contact", lastMessage: messageText, lastMessageTime: newMessage.createdAt, profilePic: "/avatar.png" };

            newUsers.unshift(newUserObj);
          }
        } else {
          const groupIndex = newGroups.findIndex(g => g._id?.toString() === groupIdStr);
          if (groupIndex !== -1) {
            const group = { ...newGroups[groupIndex], lastMessage: messageText, lastMessageTime: newMessage.createdAt };
            newGroups.splice(groupIndex, 1);
            newGroups.unshift(group);
          }
          // If group not in list, we could add it too, but usually you're in groups you see
        }

        // 3. Update unread count if chat is not open
        if (!isChatOpen && !isFromMe) {
          const idToIncrement = (groupIdStr || senderIdStr)?.toString();
          if (idToIncrement) {
            newUnreadCounts[idToIncrement] = (newUnreadCounts[idToIncrement] || 0) + 1;
          }
        }

        return {
          messages: isChatOpen ? [...messages, newMessage] : messages,
          users: newUsers,
          groups: newGroups,
          unreadCounts: newUnreadCounts,
        };
      });
    });

    socket.on("messageReaction", ({ messageId, userId, emoji }) => {
      const { messages } = get();
      const updatedMessages = messages.map((msg) => {
        if (msg._id === messageId) {
          const reactions = [...(msg.reactions || [])];
          const existingIndex = reactions.findIndex((r) => r.userId.toString() === userId.toString());

          if (emoji === null) {
            if (existingIndex >= 0) reactions.splice(existingIndex, 1);
          } else if (existingIndex >= 0) {
            reactions[existingIndex] = { ...reactions[existingIndex], emoji };
          } else {
            reactions.push({ userId, emoji });
          }

          return { ...msg, reactions };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    socket.on("messageUnsent", ({ messageId }) => {
      const { messages } = get();
      set({ messages: messages.filter((msg) => msg._id !== messageId) });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageReaction");
      socket.off("messageUnsent");
    }
  },

  setSelectedUser: (user) => {
    if (user) {
      const { unreadCounts } = get();
      const userIdStr = user._id?.toString();
      set({
        selectedUser: user,
        selectedGroup: null,
        unreadCounts: { ...unreadCounts, [userIdStr]: 0 }
      });
    } else {
      set({ selectedUser: null, selectedGroup: null });
    }
  },

  setSelectedGroup: (group) => {
    if (group) {
      const { unreadCounts } = get();
      const groupIdStr = group._id?.toString();
      set({
        selectedGroup: group,
        selectedUser: null,
        unreadCounts: { ...unreadCounts, [groupIdStr]: 0 }
      });
    } else {
      set({ selectedGroup: null, selectedUser: null });
    }
  },

  renameGroup: async (groupId, newName) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/rename`, { name: newName });
      set({
        groups: get().groups.map((group) => (group._id === groupId ? { ...group, name: newName } : group)),
        selectedGroup: get().selectedGroup?._id === groupId ? { ...get().selectedGroup, name: newName } : get().selectedGroup,
      });
      toast.success("Group renamed successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  addGroupMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/add`, { userId });
      set({
        groups: get().groups.map((group) => (group._id === groupId ? res.data : group)), // res.data is updated group
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Member added successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  removeGroupMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/remove`, { userId }); // Correct endpoint? Previously I assumed remove endpoint exists.
      // Wait, I am just pasting what I saw. I need to be careful.
      // In useChatStore view, line 158~169 was removeGroupMember.
      // I will append new actions after it.
      set({
        groups: get().groups.map((group) => (group._id === groupId ? res.data : group)),
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Friend System Actions
  friendRequests: [], // Deprecated - kept for compatibility
  receivedRequests: [],
  sentRequests: [],
  searchResults: [],
  isFriendsLoading: false,
  isSearching: false,
  isSidebarSearchActive: false,
  setSidebarSearchActive: (isActive) => set({ isSidebarSearchActive: isActive }),

  deleteChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/chat/${userId}`);
      // Remove user from the users list
      const updatedUsers = get().users.filter(user => user._id !== userId);
      set({ messages: [], selectedUser: null, users: updatedUsers });
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/auth/block/${userId}`);
      // Refresh auth to get updated blockedUsers list
      const authStore = useAuthStore.getState();
      await authStore.checkAuth();
      set({ selectedUser: null });
      toast.success("User blocked successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.post(`/auth/unblock/${userId}`);
      // Refresh auth to get updated blockedUsers list
      const authStore = useAuthStore.getState();
      await authStore.checkAuth();
      toast.success("User unblocked successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  },

  reactToMessage: async (messageId, emoji) => {
    const { messages } = get();
    const authStore = useAuthStore.getState();
    const userId = authStore.authUser?._id;

    // Optimistically update UI
    const previousMessages = messages;
    const updatedMessages = messages.map((msg) => {
      if (msg._id === messageId) {
        const reactions = [...(msg.reactions || [])];
        const existingIndex = reactions.findIndex((r) => r.userId.toString() === userId.toString());

        if (existingIndex >= 0) {
          reactions[existingIndex] = { ...reactions[existingIndex], emoji };
        } else {
          reactions.push({ userId, emoji });
        }

        return { ...msg, reactions };
      }
      return msg;
    });

    set({ messages: updatedMessages });

    try {
      await axiosInstance.post(`/messages/${messageId}/react`, { emoji });
    } catch (error) {
      toast.error("Failed to add reaction");
      set({ messages: previousMessages });
    }
  },

  removeReaction: async (messageId) => {
    const { messages } = get();
    const authStore = useAuthStore.getState();
    const userId = authStore.authUser?._id;

    // Optimistically update UI - remove user's reaction
    const previousMessages = messages;
    const updatedMessages = messages.map((msg) => {
      if (msg._id === messageId) {
        const reactions = (msg.reactions || []).filter(
          (r) => r.userId.toString() !== userId.toString()
        );
        return { ...msg, reactions };
      }
      return msg;
    });

    set({ messages: updatedMessages });

    // Send to server
    try {
      await axiosInstance.delete(`/messages/${messageId}/react`);
    } catch (error) {
      toast.error("Failed to remove reaction");
      // Revert on error
      set({ messages: previousMessages });
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();

    try {
      await axiosInstance.delete(`/messages/${messageId}/delete`);

      // Remove message from local state
      set({ messages: messages.filter((msg) => msg._id !== messageId) });

      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  },

  unsendMessage: async (messageId) => {
    const { messages } = get();

    try {
      await axiosInstance.delete(`/messages/${messageId}/unsend`);

      // Remove message from local state
      set({ messages: messages.filter((msg) => msg._id !== messageId) });

      toast.success("Message unsent");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to unsend message");
    }
  },

  getFriends: async () => {
    set({ isFriendsLoading: true });
    try {
      const res = await axiosInstance.get("/friends");
      set({ users: Array.isArray(res.data) ? res.data : [] }); // Updating 'users' with friends to show in sidebar
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({
        receivedRequests: Array.isArray(res.data.received) ? res.data.received : [],
        sentRequests: Array.isArray(res.data.sent) ? res.data.sent : [],
        friendRequests: Array.isArray(res.data.received) ? res.data.received : [] // For backward compatibility
      });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/friends/search?query=${query.trim()}`);
      set({ searchResults: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      set({ isSearching: false });
    }
  },

  sendFriendRequest: async (receiverId) => {
    try {
      const res = await axiosInstance.post("/friends/request", { receiverId });
      // Update search result status
      set({
        searchResults: get().searchResults.map(user =>
          user._id === receiverId ? { ...user, requestStatus: 'sent' } : user
        )
      });
      toast.success("Friend request sent");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      const res = await axiosInstance.post("/friends/accept", { requestId });
      set({
        receivedRequests: get().receivedRequests.filter(req => req._id !== requestId),
        friendRequests: get().friendRequests.filter(req => req._id !== requestId)
      });
      toast.success("Friend request accepted");
      get().getFriends(); // Refresh friends list
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post("/friends/reject", { requestId });
      set({
        receivedRequests: get().receivedRequests.filter(req => req._id !== requestId),
        friendRequests: get().friendRequests.filter(req => req._id !== requestId)
      });
      toast.success("Friend request rejected");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  cancelFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post("/friends/reject", { requestId }); // Reuse reject endpoint
      set({
        sentRequests: get().sentRequests.filter(req => req._id !== requestId)
      });
      toast.success("Friend request cancelled");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  removeFriend: async (friendId) => {
    try {
      await axiosInstance.post("/friends/remove", { friendId });
      set({
        users: get().users.filter((user) => user._id !== friendId),
        selectedUser: null,
      });
      toast.success("Friend removed successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Real-time features
  typingUsers: {}, // { userId: boolean }

  subscribeToTyping: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("typing", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: true },
      }));
    });

    socket.on("stopTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: false },
      }));
    });
  },

  unsubscribeFromTyping: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("typing");
    socket.off("stopTyping");
  },

  sendTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit("typing", { receiverId });
  },

  sendStopTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit("stopTyping", { receiverId });
  },

  subscribeToMessageStatus: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("messagesSeen", ({ receiverId }) => {
      const { selectedUser, messages } = get();
      if (selectedUser && selectedUser._id === receiverId) {
        set({
          messages: messages.map((msg) => ({ ...msg, status: "seen" })),
        });
      }
    });
  },

  unsubscribeFromMessageStatus: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("messagesSeen");
  },

  markMessagesAsSeen: (senderId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit("markMessagesAsSeen", { senderId });
  },

  subscribeToFriendUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newFriendRequest", (newRequest) => {
      set((state) => ({
        receivedRequests: [...state.receivedRequests, newRequest],
        friendRequests: [...state.friendRequests, newRequest],
      }));
      toast.success("New friend request received");
    });

    socket.on("friendRequestAccepted", ({ accepterName }) => {
      toast.success(`${accepterName} accepted your friend request`);
      get().getFriends();
      get().getFriendRequests();
    });
  },

  unsubscribeFromFriendUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newFriendRequest");
    socket.off("friendRequestAccepted");
  }
}));
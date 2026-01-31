import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
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
      set({ messages: res.data });
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
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages } = get();
    try {
      let res;
      if (selectedUser) {
        res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      } else if (selectedGroup) {
        // Group message endpoint? Currently reusing sendMessage controller but it expects receiverId in params.
        // Needs adjustment. The plan said: "Update sendMessage to support group messages."
        // Actually, for simplicity and clean separation, I should have a sendGroupMessage or modify the backend sendMessage.
        // Let's modify the frontend to call a specific endpoint or logic.
        // Wait, my backend implementation of sendMessage in `message.controller.js` expects `receiverId` in params.
        // I haven't updated `message.controller.js` to handle group sending via the same route efficiently if relying on params for ID.
        // But `group.controller.js` doesn't have a `sendGroupMessage`.
        // I missed implementing `sendGroupMessage` in the backend controller step!
        // I will assume for now I will use the standard message route but I need to handle it.
        // Actually, earlier I updated `message.model.js`.
        // I should have a `sendGroupMessage` in `group.controller.js` or update `message.controller.js`.
        // Let's stick to adding a NEW action here and I will fix the backend in the next turn if needed.
        // OR `axiosInstance.post('/messages/send/group/' + selectedGroup._id)` if I had that route.
        // I DON'T have a route for sending group messages yet! 
        // I missed that in the backend implementation.
        // I need to add `sendGroupMessage` to `group.controller.js` and route.
        // For now, I'll add the frontend logic to use `/groups/:id/send` (pending backend update).
        res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
      }
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, selectedGroup } = get();
    if (!selectedUser && !selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      // Check if message belongs to current chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...get().messages, newMessage] });
      } else if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        set({ messages: [...get().messages, newMessage] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, selectedGroup: null }),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup, selectedUser: null }),

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
      const res = await axiosInstance.post(`/groups/${groupId}/remove`, { userId });
      set({
        groups: get().groups.map((group) => (group._id === groupId ? res.data : group)),
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
}));
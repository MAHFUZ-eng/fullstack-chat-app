import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "https://fullstack-chat-app-9dor.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data, navigate) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success("Account created! Please verify your email.");
      // Navigate to verification page
      if (navigate) navigate("/verify-email");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      console.log("Login error:", error);
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateEmailVisibility: async (visibility) => {
    try {
      const res = await axiosInstance.put("/auth/update-email-visibility", {
        emailVisibility: visibility,
      });
      set({ authUser: res.data });
      toast.success("Email privacy updated");
    } catch (error) {
      console.log("error in update email visibility:", error);
      toast.error(error.response?.data?.message || "Failed to update privacy");
    }
  },

  verifyEmail: async (code) => {
    try {
      const res = await axiosInstance.post("/auth/verify-email", { code });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      set({ authUser: res.data });
      toast.success("Email verified successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      console.log("error in verify email:", error);
      toast.error(error.response?.data?.message || "Verification failed");
      return false;
    }
  },

  forgotPassword: async (email) => {
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      toast.success("Password reset code sent to your email");
      return true;
    } catch (error) {
      console.log("error in forgot password:", error);
      toast.error(error.response?.data?.message || "Failed to send reset code");
      return false;
    }
  },

  resetPassword: async (data) => {
    try {
      await axiosInstance.post("/auth/reset-password", data);
      toast.success("Password reset successfully");
      return true;
    } catch (error) {
      console.log("error in reset password:", error);
      toast.error(error.response?.data?.message || "Failed to reset password");
      return false;
    }
  },

  deleteAccount: async (password) => {
    try {
      await axiosInstance.delete("/auth/delete-account", { data: { password } });
      get().disconnectSocket();
      set({ authUser: null });
      localStorage.removeItem("token");
      toast.success("Account deleted successfully");
    } catch (error) {
      console.log("error in delete account:", error);
      toast.error(error?.response?.data?.message || "Failed to delete account");
      throw error;
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("connect", () => {
      console.log("✅ Socket connected! Socket ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("getOnlineUsers", (userIds) => {
      console.log("🟢 Received onlineUsers from server:", userIds);
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));



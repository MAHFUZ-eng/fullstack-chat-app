import React from "react"; // <-- this fixes the error

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPanel from "./pages/AdminPanel";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import BottomNav from "./components/BottomNav"; // Import BottomNav
import FriendsPage from "./pages/FriendsPage"; // Import FriendsPage
import UpdatePrompt from "./components/UpdatePrompt"; // Import UpdatePrompt

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const { getFriendRequests, subscribeToFriendUpdates, unsubscribeFromFriendUpdates } = useChatStore();

  useEffect(() => {
    if (authUser) {
      getFriendRequests();
      subscribeToFriendUpdates();

      // Handle Android hardware back button
      const handleBackButton = async () => {
        // If a chat is open (user or group selected), close it
        if (useChatStore.getState().selectedUser || useChatStore.getState().selectedGroup) {
          useChatStore.getState().setSelectedUser(null);
          useChatStore.getState().setSelectedGroup(null);
        } else {
          // If on main screen, exit app
          try {
            const { App } = await import('@capacitor/app');
            App.exitApp();
          } catch (e) {
            console.log("Not running in Capacitor context");
          }
        }
      };

      const setupListener = async () => {
        try {
          const { App } = await import('@capacitor/app');
          App.addListener('backButton', handleBackButton);
        } catch (e) {
          console.log("Capacitor App plugin not available");
        }
      };

      setupListener();

      return () => {
        unsubscribeFromFriendUpdates();
        import('@capacitor/app').then(({ App }) => {
          App.removeAllListeners('backButton');
        }).catch(() => { });
      };
    }
  }, [authUser, getFriendRequests, subscribeToFriendUpdates, unsubscribeFromFriendUpdates]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme} className="min-h-screen bg-base-100 transition-colors duration-300">
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/reset-password" element={!authUser ? <ResetPasswordPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/friends" element={authUser ? <FriendsPage /> : <Navigate to="/login" />} />
      </Routes>

      <UpdatePrompt />

      {authUser && <BottomNav />}

      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
          },
        }}
        containerStyle={{
          top: 20,
        }}
        limit={3} // Limit total toasts on screen
      />
    </div>
  );
};
export default App;



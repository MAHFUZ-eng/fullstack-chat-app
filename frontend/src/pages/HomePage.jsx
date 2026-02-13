import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { motion } from "framer-motion";

const HomePage = () => {
  const {
    selectedUser,
    selectedGroup,
    getUsers, // Added this
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToMessageStatus,
    unsubscribeFromMessageStatus,
    subscribeToTyping,
    unsubscribeFromTyping
  } = useChatStore();
  const { socket } = useAuthStore();

  useEffect(() => {
    if (socket) {
      getUsers();
      subscribeToMessages();
      subscribeToMessageStatus();
      subscribeToTyping();

      return () => {
        unsubscribeFromMessages();
        unsubscribeFromMessageStatus();
        unsubscribeFromTyping();
      };
    }
  }, [socket, getUsers, subscribeToMessages, unsubscribeFromMessages, subscribeToMessageStatus, unsubscribeFromMessageStatus, subscribeToTyping, unsubscribeFromTyping]);

  return (
    <div className="h-[100dvh] bg-base-100 pt-0 lg:pt-20 px-0 lg:px-4 flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto max-w-7xl flex-1 lg:h-[calc(100vh-8rem)] min-h-0"
      >
        <div className="bg-base-100 rounded-none lg:rounded-3xl shadow-2xl border-x lg:border border-base-300/50 overflow-hidden h-full">
          <div className="flex h-full">
            <div className={`h-full ${selectedUser || selectedGroup ? "hidden lg:flex" : "flex w-full lg:w-[400px]"} border-r border-base-300/50`}>
              <Sidebar />
            </div>

            <div className={`h-full ${!selectedUser && !selectedGroup ? "hidden lg:flex" : "flex w-full"} flex-1 bg-base-100`}>
              {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default HomePage;
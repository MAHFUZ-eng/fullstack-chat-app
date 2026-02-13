import { useChatStore } from "../store/useChatStore";
import React, { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Heart, Trash2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToMessageStatus,
    unsubscribeFromMessageStatus,
    markMessagesAsSeen,
    reactToMessage,
    removeReaction,
    deleteMessage,
    unsendMessage,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      markMessagesAsSeen(selectedUser._id);
    } else if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
    }
  }, [selectedUser?._id, selectedGroup?._id, getMessages, getGroupMessages, markMessagesAsSeen]);

  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId === selectedUser._id && lastMessage.status !== "seen") {
        markMessagesAsSeen(selectedUser._id);
      }
    }
  }, [messages, selectedUser, markMessagesAsSeen]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showReactionPicker && !e.target.closest('.reaction-picker')) {
        setShowReactionPicker(null);
      }
      if (showMessageOptions && !e.target.closest('.message-options')) {
        setShowMessageOptions(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showReactionPicker, showMessageOptions]);

  const handleLongPressStart = (messageId) => {
    longPressTimer.current = setTimeout(() => {
      setShowMessageOptions(messageId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleReaction = async (message, emoji) => {
    const existingReaction = message.reactions?.find(
      (r) => r.userId.toString() === authUser._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      await removeReaction(message._id);
    } else {
      reactToMessage(message._id, emoji);
    }
    setShowReactionPicker(null);
    setShowMessageOptions(null);
  };

  const handleDeleteForMe = async (messageId) => {
    await deleteMessage(messageId);
    setShowMessageOptions(null);
  };

  const handleUnsend = async (messageId) => {
    await unsendMessage(messageId);
    setShowMessageOptions(null);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-base-100 overflow-hidden relative">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar pb-10">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            let senderId;
            let senderProfilePic;
            let senderName;

            if (message.senderId && message.senderId.fullName) {
              senderId = message.senderId._id;
              senderProfilePic = message.senderId.profilePic;
              senderName = message.senderId.fullName;
            } else {
              senderId = message.senderId;
              senderProfilePic = selectedUser?.profilePic;
              senderName = selectedUser?.fullName;
            }

            const isMyMessage = senderId === authUser._id;
            const isNextMessageSameSender = index < messages.length - 1 &&
              (messages[index + 1].senderId?._id || messages[index + 1].senderId) === senderId;
            const isPrevMessageSameSender = index > 0 &&
              (messages[index - 1].senderId?._id || messages[index - 1].senderId) === senderId;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={message._id}
                className={`flex gap-3 ${isMyMessage ? "flex-row-reverse" : "flex-row"} items-end group`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 mb-1">
                  {!isMyMessage && !isNextMessageSameSender && (
                    <motion.img
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      src={senderProfilePic || "/avatar.png"}
                      alt={senderName}
                      className="w-8 h-8 rounded-[12px] object-cover shadow-sm"
                    />
                  )}
                </div>

                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMyMessage ? "items-end" : "items-start"}`}>
                  {/* Sender Name for Group */}
                  {!isMyMessage && !isPrevMessageSameSender && selectedGroup && (
                    <span className="text-[11px] font-bold text-base-content/40 mb-1 ml-1">
                      {senderName}
                    </span>
                  )}

                  <div className="relative">
                    {/* Message Bubble */}
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`
                        px-4 py-2 relative transition-all duration-200
                        ${isMyMessage
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content"
                        }
                        ${isMyMessage
                          ? `${isNextMessageSameSender ? "rounded-2xl" : "rounded-2xl rounded-br-sm"}`
                          : `${isNextMessageSameSender ? "rounded-2xl" : "rounded-2xl rounded-bl-sm"}`
                        }
                      `}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setShowMessageOptions(message._id);
                      }}
                      onTouchStart={() => handleLongPressStart(message._id)}
                      onTouchEnd={handleLongPressEnd}
                    >
                      {message.image && (
                        <div className="mb-2 overflow-hidden rounded-2xl border border-white/10">
                          <img src={message.image} alt="Attachment" className="max-w-full max-h-96 object-cover" />
                        </div>
                      )}

                      {message.text && (
                        <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap font-medium ${isMyMessage ? "text-white" : ""}`}>
                          {message.text}
                        </p>
                      )}

                      {message.audioUrl && (
                        <audio controls src={message.audioUrl} className="mt-2 w-full max-w-xs filter invert-0 brightness-110" />
                      )}

                      {/* Time and Status */}
                      <div className={`flex items-center gap-1.5 mt-0.5 ${isMyMessage ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[10px] font-medium opacity-50 ${isMyMessage ? "text-primary-content" : "text-base-content"}`}>
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isMyMessage && (
                          <div className="flex-shrink-0 flex items-center">
                            {message.status === "seen" ? (
                              <CheckCheck size={12} className="text-primary-content opacity-90" />
                            ) : (
                              <Check size={12} className="text-primary-content opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`flex flex-wrap gap-1 absolute -bottom-3 ${isMyMessage ? "right-2" : "left-2"} z-[20] pointer-events-none`}
                      >
                        {Object.entries(
                          message.reactions.reduce((acc, r) => {
                            if (r.emoji) acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <div
                            key={emoji}
                            className="bg-base-100 border border-base-300 shadow-sm rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1 scale-110"
                          >
                            <span>{emoji}</span>
                            {count > 1 && <span className="font-bold opacity-60">{count}</span>}
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Context Menus */}
                    <AnimatePresence>
                      {showReactionPicker === message._id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="reaction-picker absolute -top-16 left-1/2 -translate-x-1/2 bg-base-100/80 backdrop-blur-2xl px-4 py-2 rounded-full shadow-2xl flex gap-3 border border-base-300 z-[100]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message, emoji)}
                              className="text-2xl hover:scale-150 active:scale-95 transition-transform duration-200"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Unified Context Menu */}
                    <AnimatePresence>
                      {showMessageOptions === message._id && (
                        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
                          {/* Backdrop overlay */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-base-300/20 backdrop-blur-sm"
                            onClick={() => setShowMessageOptions(null)}
                          />

                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="message-options relative bg-base-100/95 backdrop-blur-2xl rounded-[2.5rem] p-5 flex flex-col gap-3 min-w-[260px] border border-base-300 shadow-[0_32px_64px_rgba(0,0,0,0.15)] z-[9999]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Quick Reactions Bar */}
                            <div className="flex justify-between items-center px-2 py-1 mb-2 bg-base-200/50 rounded-2xl">
                              {REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(message, emoji)}
                                  className="text-2xl hover:scale-125 active:scale-90 transition-transform p-1.5"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            <div className="flex flex-col gap-1">
                              <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => handleUnsend(message._id)}
                                className="flex items-center gap-4 px-4 py-3.5 hover:bg-warning/5 text-warning rounded-2xl transition-all font-bold text-sm"
                              >
                                <div className="size-9 rounded-xl bg-warning/10 flex items-center justify-center"><RotateCcw size={18} /></div>
                                <div className="flex flex-col items-start translate-y-[-1px]">
                                  <span>Unsend</span>
                                  <span className="text-[9px] opacity-40 uppercase tracking-wider">Delete for everyone</span>
                                </div>
                              </motion.button>

                              <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => handleDeleteForMe(message._id)}
                                className="flex items-center gap-4 px-4 py-3.5 hover:bg-error/5 text-error rounded-2xl transition-all font-bold text-sm"
                              >
                                <div className="size-9 rounded-xl bg-error/10 flex items-center justify-center"><Trash2 size={18} /></div>
                                <div className="flex flex-col items-start translate-y-[-1px]">
                                  <span>Delete for me</span>
                                  <span className="text-[9px] opacity-40 uppercase tracking-wider">Remove from your view</span>
                                </div>
                              </motion.button>
                            </div>

                            <button
                              onClick={() => setShowMessageOptions(null)}
                              className="btn btn-ghost btn-sm h-11 rounded-xl text-base-content/40 hover:text-base-content"
                            >
                              Dismiss
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messageEndRef} />
        </AnimatePresence>
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
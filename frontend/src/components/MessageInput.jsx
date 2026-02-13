import React, { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, StopCircle, Ban, Paperclip, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, sendTyping, sendStopTyping, selectedUser, unblockUser } = useChatStore();
  const { authUser } = useAuthStore();
  const typingTimeoutRef = useRef(null);

  const isUserBlocked = authUser?.blockedUsers?.includes(selectedUser?._id);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (selectedUser) {
      sendTyping(selectedUser._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping(selectedUser._id);
      }, 3000);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } catch (error) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let audioBase64 = null;
      if (audioBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        await new Promise((resolve) => {
          reader.onloadend = () => {
            audioBase64 = reader.result;
            resolve();
          };
        });
      }

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      setRecordingDuration(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleUnblock = async () => {
    if (selectedUser) await unblockUser(selectedUser._id);
  };

  if (isUserBlocked) {
    return (
      <div className="p-6 bg-base-100/50 backdrop-blur-xl border-t border-base-300">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 bg-warning/10 p-4 rounded-[2rem] border border-warning/20 shadow-xl shadow-warning/5"
        >
          <div className="size-10 rounded-full bg-warning/20 flex items-center justify-center text-warning">
            <Ban className="size-5" />
          </div>
          <span className="text-sm font-bold text-base-content/70">You blocked this user</span>
          <button onClick={handleUnblock} className="btn btn-sm btn-success rounded-xl font-black px-6">
            Unblock
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-3 pb-safe-offset bg-base-100 border-t border-base-300 relative z-50">
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full left-0 right-0 p-4 bg-base-100 border-t border-base-300 z-[60]"
          >
            <div className="relative w-24 h-24 group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-base-300" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 size-5 rounded-full bg-error text-white flex items-center justify-center shadow-sm"
              >
                <X className="size-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {audioBlob && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 p-4 bg-base-100 border-t border-base-300 z-[60]"
          >
            <div className="flex items-center gap-4 bg-base-200 p-2 rounded-2xl w-fit border border-base-300">
              <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 w-48" />
              <button onClick={() => setAudioBlob(null)} className="size-8 rounded-full bg-error/10 text-error flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3 max-w-5xl mx-auto">
        <div className="flex-1 relative flex items-center">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex-1 flex items-center gap-4 bg-error/10 text-error px-6 py-3 rounded-[2rem] border border-error/20"
              >
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-error animate-ping" />
                  <span className="font-black text-xs uppercase tracking-widest">Recording...</span>
                </div>
                <span className="font-mono font-black ml-auto">{formatDuration(recordingDuration)}</span>
                <button
                  onClick={() => { stopRecording(); setAudioBlob(null); }}
                  className="text-error/60 hover:text-error transition-colors font-bold text-xs uppercase"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col gap-2"
              >
                <div className="relative flex items-end bg-base-200 p-1.5 rounded-3xl border border-transparent focus-within:border-primary/20 transition-all">
                  <button className="btn btn-ghost btn-circle btn-sm ml-1 text-base-content/30 hover:text-primary transition-colors">
                    <Smile className="size-5" />
                  </button>

                  <textarea
                    value={text}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="textarea textarea-ghost flex-1 resize-none min-h-[40px] max-h-32 focus:bg-transparent font-medium py-2.5"
                    rows={1}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <div className="flex items-center pr-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`btn btn-ghost btn-circle btn-sm ${imagePreview ? "text-primary" : "text-base-content/40"}`}
                    >
                      <Paperclip className="size-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="btn btn-error btn-circle shadow-lg shadow-error/20 animate-pulse"
            >
              <StopCircle size={24} className="text-white" />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary transition-all"
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic size={20} />
              </button>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!text.trim() && !imagePreview && !audioBlob}
                className="btn btn-primary btn-circle btn-sm ml-1"
              >
                <Send size={16} className="text-primary-content" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
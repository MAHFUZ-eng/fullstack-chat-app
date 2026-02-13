import React, { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Trash2, ChevronDown, Palette, ShieldCheck, AlertTriangle, Eye, EyeOff, UserMinus, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { deleteAccount, authUser, updateEmailVisibility } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      return toast.error("Please enter your password to confirm");
    }
    try {
      await deleteAccount(deletePassword);
      setShowDeleteConfirm(false);
      setDeletePassword("");
    } catch (error) {
      console.error("Delete account error:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-base-100 pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <motion.div
        className="container mx-auto max-w-3xl w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              Settings <Sparkles className="text-primary size-6 sm:size-8" />
            </h1>
            <p className="text-sm sm:text-base text-base-content/60">Manage your account preferences and application appearance.</p>
          </div>

          {/* Sections List */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Appearance Section */}
            <motion.div variants={itemVariants} className="card bg-base-200/50 backdrop-blur-xl border border-base-300 shadow-xl overflow-hidden">
              <div className="card-body p-0">
                <button
                  onClick={() => setIsThemesOpen(!isThemesOpen)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-base-300/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/10 text-primary shrink-0">
                      <Palette className="size-5 sm:size-6" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-left min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold truncate">Appearance</h2>
                      <p className="text-xs sm:text-sm text-base-content/60 truncate">Customize your chat interface themes</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-5 sm:size-6 shrink-0 transition-transform duration-500 ${isThemesOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isThemesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden bg-base-200/30"
                    >
                      <div className="px-5 sm:px-8 pb-8 space-y-8 pt-2">
                        {/* Theme Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                          {THEMES.map((t) => (
                            <motion.button
                              key={t}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`
                                group flex flex-col items-center gap-2 p-2 rounded-xl transition-all
                                ${theme === t ? "bg-base-100 shadow-md ring-2 ring-primary" : "hover:bg-base-100/50"}
                              `}
                              onClick={() => setTheme(t)}
                            >
                              <div className="relative h-10 w-full rounded-lg overflow-hidden border border-base-300" data-theme={t}>
                                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                                  <div className="rounded bg-primary"></div>
                                  <div className="rounded bg-secondary"></div>
                                  <div className="rounded bg-accent"></div>
                                  <div className="rounded bg-neutral"></div>
                                </div>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider font-bold truncate w-full text-center opacity-70 group-hover:opacity-100">
                                {t}
                              </span>
                            </motion.button>
                          ))}
                        </div>

                        {/* Preview Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-base-content/40">
                            <div className="h-px flex-1 bg-current opacity-10"></div>
                            Live Preview
                            <div className="h-px flex-1 bg-current opacity-10"></div>
                          </div>

                          <div className="rounded-2xl border border-base-300 overflow-hidden bg-base-100 shadow-2xl">
                            <div className="p-4 bg-base-200/50 backdrop-blur-sm">
                              <div className="max-w-md mx-auto">
                                <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-base-300">
                                  <div className="px-4 py-3 border-b border-base-300 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">J</div>
                                    <div>
                                      <h3 className="font-bold text-xs uppercase tracking-tight">Preview User</h3>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                        <p className="text-[10px] text-base-content/50 font-medium">Active now</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-4 min-h-[160px] bg-base-100/50">
                                    {PREVIEW_MESSAGES.map((msg) => (
                                      <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.isSent ? "bg-primary text-primary-content" : "bg-base-200"}`}>
                                          <p className="text-xs font-medium">{msg.content}</p>
                                          <p className="text-[9px] mt-1.5 opacity-60 text-right">12:00 PM</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="p-3 border-t border-base-300 bg-base-100/80 flex gap-2">
                                    <div className="h-9 flex-1 bg-base-200 rounded-lg flex items-center px-3 text-[11px] text-base-content/40">Type a message...</div>
                                    <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-content shadow-lg shadow-primary/20"><Send className="size-4" /></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Privacy Section */}
            <motion.div variants={itemVariants} className="card bg-base-200/50 backdrop-blur-xl border border-base-300 shadow-xl overflow-hidden">
              <div className="card-body p-0">
                <button
                  onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-base-300/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-secondary/10 text-secondary shrink-0">
                      <ShieldCheck className="size-5 sm:size-6" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-left min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold truncate">Privacy</h2>
                      <p className="text-xs sm:text-sm text-base-content/60 truncate">Manage your visibility</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-5 sm:size-6 shrink-0 transition-transform duration-500 ${isPrivacyOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isPrivacyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden bg-base-200/30"
                    >
                      <div className="px-5 sm:px-8 pb-8 pt-2">
                        <div className="form-control max-w-md">
                          <label className="label py-2">
                            <span className="label-text font-bold text-xs sm:text-sm">Who can see my email?</span>
                          </label>
                          <div className="relative group">
                            <select
                              className="select select-bordered w-full pl-10 pr-4 h-11 sm:h-12 rounded-xl text-sm border-base-300 focus:border-primary transition-all appearance-none bg-base-100"
                              value={authUser?.emailVisibility || "everyone"}
                              onChange={(e) => updateEmailVisibility(e.target.value)}
                            >
                              <option value="everyone">Everyone</option>
                              <option value="friends_only">Friends Only</option>
                              <option value="only_me">Only Me</option>
                            </select>
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none">
                              {authUser?.emailVisibility === "only_me" ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                          </div>
                          <label className="label py-2">
                            <span className="label-text-alt text-[10px] sm:text-[11px] text-base-content/50 italic leading-snug">
                              Determines if others can find or view your email address on your profile and search.
                            </span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Danger Zone Section */}
            <motion.div variants={itemVariants} className="card bg-base-200/50 backdrop-blur-xl border border-base-300 shadow-xl overflow-hidden">
              <div className="card-body p-0">
                <button
                  onClick={() => setIsDangerOpen(!isDangerOpen)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-base-300/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-error/10 text-error shrink-0">
                      <AlertTriangle className="size-5 sm:size-6" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-left min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold truncate">Danger Zone</h2>
                      <p className="text-xs sm:text-sm text-base-content/60 truncate">Dangerous actions</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-5 sm:size-6 shrink-0 transition-transform duration-500 ${isDangerOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isDangerOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden bg-base-200/30"
                    >
                      <div className="px-5 sm:px-8 pb-8 pt-2 space-y-4">
                        <div className="p-3.5 sm:p-4 rounded-xl bg-error/5 border border-error/20 max-w-md">
                          <p className="text-[10px] sm:text-xs text-base-content/70 leading-relaxed font-medium">
                            Deleting your account will permanently purge all your data including messages and friends.
                          </p>
                        </div>

                        {!showDeleteConfirm ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-error btn-outline w-full max-w-md rounded-xl border-2 h-11 sm:h-12 text-sm"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            <Trash2 className="size-4 sm:size-5" />
                            Delete Account
                          </motion.button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-3 max-w-md"
                          >
                            <p className="text-[10px] sm:text-sm font-bold text-center text-error animate-pulse uppercase tracking-tighter">Are you absolutely sure?</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button className="btn btn-error h-11 sm:h-12 rounded-xl shadow-lg shadow-error/20 text-sm" onClick={handleDeleteAccount}>Confirm</button>
                              <button className="btn btn-ghost h-11 sm:h-12 rounded-xl text-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="modal modal-open backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="modal-box bg-base-100 border border-error/20 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-[95%] sm:w-full max-w-lg"
            >
              <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-full bg-error/10 text-error ring-8 ring-error/5">
                  <Trash2 className="size-10 sm:size-12" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-extrabold text-2xl sm:text-3xl tracking-tight">Final Goodbye?</h3>
                  <p className="py-3 sm:py-4 text-sm sm:text-base text-base-content/60 leading-relaxed font-medium">
                    This action is <span className="text-error font-extrabold uppercase ring-1 ring-error/30 px-1 rounded">irreversible</span>. Enter your password to confirm.
                  </p>
                </div>

                <div className="w-full max-w-sm">
                  <input
                    type="password"
                    placeholder="Enter password..."
                    className="input input-bordered w-full h-12 rounded-xl text-center focus:border-error transition-all"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-action grid grid-cols-2 gap-2 sm:gap-3 mt-4">
                <button className="btn btn-ghost border border-base-300 rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-lg px-2" onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                }}>
                  Cancel
                </button>
                <button
                  className={`btn btn-error rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-lg shadow-lg shadow-error/20 px-2`}
                  onClick={handleDeleteAccount}
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
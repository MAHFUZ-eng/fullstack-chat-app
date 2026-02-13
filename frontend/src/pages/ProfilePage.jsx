import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, ShieldCheck, Calendar, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-base-100">
      {/* Mobile Top Bar */}
      <div className="lg:hidden px-6 pt-12 pb-4 flex items-center gap-4">
        <Link to="/" className="p-2 -ml-2 hover:bg-base-200 rounded-full transition-colors">
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-8 pb-32 lg:pt-24 lg:pb-12">
        <motion.div
          className="max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-base-100 rounded-3xl p-6 lg:p-10 shadow-2xl border border-base-300 space-y-10">
            {/* Header section */}
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                <Sparkles className="size-3" /> User Profile
              </div>
              <h1 className="text-3xl font-black tracking-tight">Personal Info</h1>
              <p className="text-base-content/40 font-medium">Manage your public presence and account details</p>
            </motion.div>

            {/* Avatar section */}
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
                <div className="relative">
                  <img
                    src={selectedImg || authUser?.profilePic || "/avatar.png"}
                    alt="Profile"
                    className="size-40 rounded-[2.5rem] object-cover border-4 border-base-100 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`
                      absolute -bottom-2 -right-2 
                      bg-primary hover:bg-primary-focus
                      p-3 rounded-2xl cursor-pointer 
                      transition-all duration-300 shadow-xl shadow-primary/30
                      group-hover:translate-x-1 group-hover:translate-y-1
                      ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                    `}
                  >
                    <Camera className="size-6 text-primary-content" />
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUpdatingProfile}
                    />
                  </label>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-base-content/60">
                  {isUpdatingProfile ? (
                    <span className="flex items-center gap-2 text-primary">
                      <span className="loading loading-spinner loading-xs"></span>
                      Updating your look...
                    </span>
                  ) : (
                    "Tap to change avatar"
                  )}
                </p>
              </div>
            </motion.div>

            {/* Form Fields */}
            <motion.div variants={itemVariants} className="grid gap-6">
              <div className="space-y-2.5">
                <div className="text-[10px] font-black text-base-content/40 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <User className="size-3" /> Full Name
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-base-content/20 group-hover:text-primary/50 transition-colors">
                    <User className="size-5" />
                  </div>
                  <div className="w-full bg-base-200/50 border border-transparent hover:border-primary/20 h-14 rounded-2xl pl-12 pr-4 flex items-center font-bold text-base-content shadow-inner transition-all">
                    {authUser?.fullName}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-[10px] font-black text-base-content/40 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Mail className="size-3" /> Email Address
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-base-content/20 group-hover:text-primary/50 transition-colors">
                    <Mail className="size-5" />
                  </div>
                  <div className="w-full bg-base-200/50 border border-transparent hover:border-primary/20 h-14 rounded-2xl pl-12 pr-4 flex items-center font-bold text-base-content/60 shadow-inner transition-all">
                    {authUser?.email}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Info Stats */}
            <motion.div variants={itemVariants} className="pt-6 border-t border-base-300/50">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2 px-1">
                <ShieldCheck className="size-4" /> Account Verification
              </h2>

              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-base-200/30 hover:bg-base-200/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-base-content/40 tracking-widest">Joining Date</p>
                      <p className="font-bold text-sm tracking-tight">{authUser.createdAt?.split("T")[0]}</p>
                    </div>
                  </div>
                  <div className="badge badge-primary bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase">Original</div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-base-200/30 hover:bg-base-200/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-success/10 flex items-center justify-center text-success transition-colors group-hover:bg-success group-hover:text-success-content">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-base-content/40 tracking-widest">Account Status</p>
                      <p className="font-bold text-sm tracking-tight text-success">Verified Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 h-6 px-3 rounded-lg bg-success/10 text-success text-[10px] font-black uppercase tracking-widest">
                    <div className="size-1.5 rounded-full bg-success animate-pulse" />
                    Live
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
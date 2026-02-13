import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search } from "lucide-react";
import { motion } from "framer-motion";

const CreateGroupModal = ({ onClose }) => {
    const { allUsers: users, createGroup, getUsers } = useChatStore();
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    React.useEffect(() => {
        getUsers();
    }, [getUsers]);

    const toggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter((id) => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName || selectedMembers.length === 0) return;

        const success = await createGroup({ name: groupName, members: selectedMembers });
        if (success) {
            onClose();
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-base-100/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-base-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-base-300"
            >
                <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100">
                    <div>
                        <h2 className="text-lg font-bold">New Group</h2>
                        <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">Select at least 1 member</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-base-content/40">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-base-content/30 uppercase tracking-[0.15em] ml-1">Group Details</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="input w-full bg-base-200 border-none focus:bg-base-200/50 h-12 rounded-2xl px-5 font-bold transition-all text-sm"
                            placeholder="Enter group name..."
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-base-content/30 uppercase tracking-[0.15em] ml-1">Add Members</label>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{selectedMembers.length} Selected</span>
                        </div>

                        <div className="relative mb-2">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-base-content/20" />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input input-sm w-full bg-base-200 border-none rounded-xl pl-10 h-9 text-xs"
                            />
                        </div>

                        <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-8 opacity-30 text-xs font-medium">No results found</div>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedMembers.includes(user._id);
                                    return (
                                        <div
                                            key={user._id}
                                            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? "bg-primary/5" : "hover:bg-base-200"}`}
                                            onClick={() => toggleMember(user._id)}
                                        >
                                            <div className="relative">
                                                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-10 rounded-xl object-cover" />
                                                <div className={`absolute -top-1 -right-1 size-4 rounded-full border-2 border-base-100 flex items-center justify-center transition-all ${isSelected ? "bg-primary scale-100" : "bg-base-300 scale-0"}`}>
                                                    <div className="size-1.5 rounded-full bg-primary-content" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${isSelected ? "text-primary" : "text-base-content"}`}>{user.fullName}</p>
                                                <p className="text-[10px] text-base-content/40 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary w-full h-12 rounded-2xl border-none font-bold transition-all ${(!groupName || selectedMembers.length === 0) ? "opacity-30" : "shadow-lg shadow-primary/20"}`}
                        disabled={!groupName || selectedMembers.length === 0}
                    >
                        Create Group
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateGroupModal;

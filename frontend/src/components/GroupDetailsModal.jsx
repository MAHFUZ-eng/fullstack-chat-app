import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Trash2, UserPlus, Edit2, Check, UserMinus } from "lucide-react";

const GroupDetailsModal = ({ onClose }) => {
    const { selectedGroup, allUsers: users, getUsers, renameGroup, addGroupMember, removeGroupMember } = useChatStore();
    const { authUser } = useAuthStore();

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(selectedGroup?.name || "");
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    if (!selectedGroup) return null;

    const isAdmin = selectedGroup.admin === authUser._id;

    const handleRename = async () => {
        if (!newName.trim()) return;
        await renameGroup(selectedGroup._id, newName);
        setIsEditingName(false);
    };

    const handleAddMember = async (userId) => {
        await addGroupMember(selectedGroup._id, userId);
        setIsAddingMember(false);
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        await removeGroupMember(selectedGroup._id, userId);
    };

    const nonMembers = users.filter(user =>
        !selectedGroup.members.some(member => member._id === user._id)
    );

    const filteredNonMembers = nonMembers.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 transition-opacity"
                onClick={onClose}
            />

            {/* Modal/Sheet */}
            <div className="bg-base-100 w-full sm:max-w-md max-h-[85vh] sm:rounded-2xl rounded-t-3xl shadow-2xl border-t-2 border-base-300 overflow-hidden relative transform transition-all z-10 animate-in slide-in-from-bottom duration-300 flex flex-col">

                {/* Mobile Handle */}
                <div className="w-12 h-1.5 bg-base-300 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

                <div className="flex justify-between items-center p-4 border-b border-base-200">
                    <h2 className="text-xl font-bold">Group Details</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 pb-20">
                    {/* Group Name & Rename */}
                    <div>
                        <label className="label text-sm text-zinc-500 font-medium">Group Name</label>
                        <div className="flex items-center gap-2 bg-base-200 p-2 rounded-lg">
                            {isEditingName ? (
                                <>
                                    <input
                                        type="text"
                                        className="input input-ghost w-full input-sm focus:outline-none bg-transparent"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={handleRename} className="btn btn-sm btn-primary btn-circle">
                                        <Check className="size-4" />
                                    </button>
                                    <button onClick={() => setIsEditingName(false)} className="btn btn-sm btn-ghost btn-circle">
                                        <X className="size-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-lg font-medium flex-1 truncate px-2">{selectedGroup.name}</span>
                                    {isAdmin && (
                                        <button onClick={() => setIsEditingName(true)} className="btn btn-ghost btn-sm btn-circle" title="Rename Group">
                                            <Edit2 className="size-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Members List */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">Members <span className="text-zinc-500 text-sm font-normal">({selectedGroup.members.length})</span></h3>
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        setIsAddingMember(!isAddingMember);
                                        if (!isAddingMember) getUsers();
                                    }}
                                    className="btn btn-sm btn-primary btn-outline gap-1 rounded-full"
                                >
                                    {isAddingMember ? <X className="size-4" /> : <UserPlus className="size-4" />}
                                    {isAddingMember ? "Cancel" : "Add"}
                                </button>
                            )}
                        </div>

                        {isAddingMember && (
                            <div className="mb-4 bg-base-200 p-3 rounded-xl animate-in fade-in zoom-in duration-200">
                                <input
                                    type="text"
                                    placeholder="Search users to add..."
                                    className="input input-sm w-full mb-3 bg-base-100"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                    {filteredNonMembers.map(user => (
                                        <div key={user._id} className="flex justify-between items-center p-2 hover:bg-base-100 rounded-lg transition-colors">
                                            <div className="flex items-center gap-2">
                                                <img src={user.profilePic || "/avatar.png"} className="size-8 rounded-full object-cover" />
                                                <span className="text-sm font-medium">{user.fullName}</span>
                                            </div>
                                            <button onClick={() => handleAddMember(user._id)} className="btn btn-xs btn-primary">Add</button>
                                        </div>
                                    ))}
                                    {filteredNonMembers.length === 0 && <p className="text-xs text-center text-zinc-500 py-2">No users found</p>}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {selectedGroup.members.map((member) => (
                                <div key={member._id} className="flex items-center justify-between p-3 bg-base-100 border border-base-200 rounded-xl">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <img src={member.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover" />
                                        <div className="min-w-0">
                                            <div className="font-medium truncate flex items-center gap-2">
                                                {member.fullName}
                                                {selectedGroup.admin === member._id && <span className="badge badge-xs badge-primary">Admin</span>}
                                            </div>
                                            <div className="text-xs text-zinc-500 truncate">{member.email}</div>
                                        </div>
                                    </div>

                                    {isAdmin && member._id !== authUser._id && (
                                        <button
                                            onClick={() => handleRemoveMember(member._id)}
                                            className="btn btn-ghost btn-sm btn-circle text-error bg-error/10 hover:bg-error/20"
                                            title="Remove Member"
                                        >
                                            <UserMinus className="size-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {/* Explicit spacer to ensure last item is scrollable above mobile safe areas */}
                            <div className="h-24 sm:h-0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetailsModal;

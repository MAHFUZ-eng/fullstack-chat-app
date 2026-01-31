import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Trash2, UserPlus, Edit2, Check, UserMinus } from "lucide-react";

const GroupDetailsModal = ({ onClose }) => {
    const { selectedGroup, users, getUsers, renameGroup, addGroupMember, removeGroupMember } = useChatStore();
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
        setIsAddingMember(false); // Close add mode? Or keep open? Let's close for now or keep to add more.
        // Ideally keep open but reset query or show 'Added'. 
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        await removeGroupMember(selectedGroup._id, userId);
    };

    // Filter users to show only those NOT in the group for adding
    const nonMembers = users.filter(user =>
        !selectedGroup.members.some(member => member._id === user._id)
    );

    const filteredNonMembers = nonMembers.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Group Details</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Group Name & Rename */}
                <div className="mb-6">
                    <label className="label text-sm text-zinc-500">Group Name</label>
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <>
                                <input
                                    type="text"
                                    className="input input-bordered w-full input-sm"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
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
                                <span className="text-lg font-medium flex-1 truncate">{selectedGroup.name}</span>
                                <button onClick={() => setIsEditingName(true)} className="btn btn-ghost btn-sm btn-circle" title="Rename Group">
                                    <Edit2 className="size-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Members List */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Members ({selectedGroup.members.length})</h3>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setIsAddingMember(!isAddingMember);
                                getUsers(); // Refresh users list
                            }}
                            className="btn btn-xs btn-outline gap-1"
                        >
                            {isAddingMember ? <X className="size-3" /> : <UserPlus className="size-3" />}
                            {isAddingMember ? "Cancel" : "Add Member"}
                        </button>
                    )}
                </div>

                {isAddingMember && (
                    <div className="mb-4 bg-base-200 p-2 rounded-lg">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="input input-sm w-full mb-2"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {filteredNonMembers.map(user => (
                                <div key={user._id} className="flex justify-between items-center p-2 hover:bg-base-300 rounded">
                                    <div className="flex items-center gap-2">
                                        <img src={user.profilePic || "/avatar.png"} className="size-6 rounded-full" />
                                        <span className="text-sm">{user.fullName}</span>
                                    </div>
                                    <button onClick={() => handleAddMember(user._id)} className="btn btn-xs btn-primary">Add</button>
                                </div>
                            ))}
                            {filteredNonMembers.length === 0 && <p className="text-xs text-center text-zinc-500">No users found</p>}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2">
                    {selectedGroup.members.map((member) => (
                        <div key={member._id} className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <img src={member.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover" />
                                <div className="min-w-0">
                                    <div className="font-medium truncate flex items-center gap-2">
                                        {member.fullName}
                                        {selectedGroup.admin === member._id && <span className="badge badge-xs badge-primary">Admin</span>}
                                    </div>
                                    <div className="text-xs text-zinc-400 truncate">{member.email}</div>
                                </div>
                            </div>

                            {isAdmin && member._id !== authUser._id && (
                                <button
                                    onClick={() => handleRemoveMember(member._id)}
                                    className="btn btn-ghost btn-sm btn-circle text-error"
                                    title="Remove Member"
                                >
                                    <UserMinus className="size-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default GroupDetailsModal;

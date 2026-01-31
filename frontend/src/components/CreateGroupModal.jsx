import React, { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
    const { users, getUsers, createGroup } = useChatStore();
    const { authUser } = useAuthStore();
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);

    // useEffect(() => {
    //     getUsers();
    // }, [getUsers]);

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create Group</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">
                            <span className="label-text">Group Name</span>
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Enter group name"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">
                            <span className="label-text">Select Members</span>
                        </label>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                            {users.map((user) => (
                                <div key={user._id} className="flex items-center gap-3 hover:bg-base-200 p-2 rounded cursor-pointer" onClick={() => toggleMember(user._id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(user._id)}
                                        onChange={() => { }} // handled by div click
                                        className="checkbox checkbox-sm"
                                    />
                                    <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-8 rounded-full object-cover" />
                                    <span>{user.fullName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={!groupName || selectedMembers.length === 0}>
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;

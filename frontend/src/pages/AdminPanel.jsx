import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { Shield, Key, Users, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const AdminPanel = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState(searchParams.get("token") || "");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await axiosInstance.get(`/admin/users?token=${token}`);
            setUsers(res.data);
            setIsAuthenticated(true);
            toast.success("Admin access granted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid admin token");
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setIsLoading(true);
        try {
            await axiosInstance.post(
                `/admin/reset-password?token=${token}`,
                { email: selectedUser.email, newPassword }
            );
            toast.success(`Password reset for ${selectedUser.email}`);
            setSelectedUser(null);
            setNewPassword("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-center mb-4">
                            <Shield className="size-16 text-error" />
                        </div>
                        <h2 className="card-title justify-center text-2xl">Admin Access Required</h2>
                        <p className="text-center text-base-content/60">Enter admin token to continue</p>
                        <div className="form-control mt-4">
                            <input
                                type="password"
                                placeholder="Admin Token"
                                className="input input-bordered"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                        <button onClick={fetchUsers} className="btn btn-primary mt-4">
                            Access Admin Panel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading && users.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="container mx-auto max-w-6xl">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="size-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <p className="text-base-content/60">Manage users and reset passwords</p>
                    </div>
                </div>

                <div className="stats shadow mb-6 w-full">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <Users className="size-8" />
                        </div>
                        <div className="stat-title">Total Users</div>
                        <div className="stat-value text-primary">{users.length}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <CheckCircle className="size-8" />
                        </div>
                        <div className="stat-title">With Security Questions</div>
                        <div className="stat-value text-success">
                            {users.filter((u) => u.hasSecurityQuestion).length}
                        </div>
                    </div>
                    <div className="stat">
                        <div className="stat-figure text-error">
                            <XCircle className="size-8" />
                        </div>
                        <div className="stat-title">Without Security Questions</div>
                        <div className="stat-value text-error">
                            {users.filter((u) => !u.hasSecurityQuestion).length}
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex items-center gap-2 mb-4">
                            <RefreshCw className="size-6 text-primary" />
                            <h2 className="card-title">Release Management</h2>
                        </div>
                        <p className="text-sm text-zinc-500 mb-4">
                            Publish a new version of the app. Users will be prompted to update.
                        </p>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = {
                                version: formData.get("version"),
                                downloadUrl: formData.get("downloadUrl"),
                                releaseNotes: formData.get("releaseNotes"),
                                forceUpdate: formData.get("forceUpdate") === "on",
                            };

                            setIsLoading(true);
                            axiosInstance.post(`/admin/version?token=${token}`, data)
                                .then(() => {
                                    toast.success("New version published successfully!");
                                    e.target.reset();
                                })
                        })
                                .catch((err) => {
                            toast.error(err.response?.data?.message || "Failed to publish version");
                                })
                                .finally(() => setIsLoading(false));
                        }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Version (e.g., 1.0.2)</span>
                                </label>
                                <input name="version" type="text" placeholder="1.0.2" className="input input-bordered" required />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Download URL (APK Link)</span>
                                </label>
                                <input name="downloadUrl" type="url" placeholder="https://..." className="input input-bordered" required />
                            </div>
                        </div>
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Release Notes</span>
                            </label>
                            <textarea name="releaseNotes" className="textarea textarea-bordered h-24" placeholder="What's new in this update?"></textarea>
                        </div>
                        <div className="form-control mt-4">
                            <label className="label cursor-pointer justify-start gap-4">
                                <span className="label-text">Force Update? (Important Security Fixes)</span>
                                <input name="forceUpdate" type="checkbox" className="checkbox checkbox-primary" />
                            </label>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button type="submit" className="btn btn-primary flex-1" disabled={isLoading}>
                                Publish Update
                            </button>
                            <button
                                type="button"
                                className="btn btn-error btn-outline"
                                onClick={() => {
                                    if (!window.confirm("Are you sure? This will stop the update notification for everyone.")) return;
                                    setIsLoading(true);
                                    axiosInstance.delete(`/admin/version?token=${token}`)
                                        .then(() => toast.success("Update notification stopped"))
                                        .catch(() => toast.error("Failed to stop update"))
                                        .finally(() => setIsLoading(false));
                                }}
                                disabled={isLoading}
                            >
                                Stop Notification
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">User List</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Registered</th>
                                    <th>Security Question</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td className="font-medium">{user.fullName}</td>
                                        <td>{user.email}</td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {user.hasSecurityQuestion ? (
                                                <span className="badge badge-success gap-1">
                                                    <CheckCircle className="size-3" /> Set
                                                </span>
                                            ) : (
                                                <span className="badge badge-error gap-1">
                                                    <XCircle className="size-3" /> Not Set
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="btn btn-sm btn-primary gap-1"
                                            >
                                                <Key className="size-3" />
                                                Reset Password
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Reset Password Modal */}
            {selectedUser && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Reset Password</h3>
                        <p className="mb-4">
                            Resetting password for: <strong>{selectedUser.email}</strong>
                        </p>
                        <form onSubmit={handleResetPassword}>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">New Password</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter new password"
                                    className="input input-bordered"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoFocus
                                />
                                <label className="label">
                                    <span className="label-text-alt">Minimum 6 characters</span>
                                </label>
                            </div>
                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setNewPassword("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </div >
    );
};

export default AdminPanel;

import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Mail, MessageSquare } from "lucide-react";
import AuthImagePattern from "../components/AuthImagePattern";
import { useNavigate, Link } from "react-router-dom";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const { forgotPassword } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await forgotPassword(email);
        if (success) navigate("/reset-password");
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex flex-col justify-center items-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2 group">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <MessageSquare className="size-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2">Forgot Password</h1>
                            <p className="text-base-content/60">Enter your email to receive a reset code</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Email</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="size-5 text-base-content/40" />
                                </div>
                                <input
                                    type="email"
                                    className={`input input-bordered w-full pl-10`}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full">
                            Send Reset Code
                        </button>
                    </form>

                    <div className="text-center">
                        <Link to="/login" className="link link-primary">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
            <AuthImagePattern
                title="Reset your password"
                subtitle="Forgot your password? No worries, we'll help you reset it."
            />
        </div>
    );
};
export default ForgotPasswordPage;

import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Mail, MessageSquare } from "lucide-react";
import AuthImagePattern from "../components/AuthImagePattern";
import { useNavigate } from "react-router-dom";

const VerifyEmailPage = () => {
    const [code, setCode] = useState("");
    const { verifyEmail, isCheckingAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await verifyEmail(code);
        if (success) navigate("/");
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
                            <h1 className="text-2xl font-bold mt-2">Verify Email</h1>
                            <p className="text-base-content/60">Enter the 6-digit code sent to your email</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Verification Code</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="size-5 text-base-content/40" />
                                </div>
                                <input
                                    type="text"
                                    className={`input input-bordered w-full pl-10`}
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full">
                            Verify Email
                        </button>
                    </form>
                </div>
            </div>
            <AuthImagePattern
                title="Verify your account"
                subtitle="We sent a verification code to your email address to ensure it's really you."
            />
        </div>
    );
};
export default VerifyEmailPage;

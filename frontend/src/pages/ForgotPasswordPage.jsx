import React, { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { Mail, MessageSquare, Lock, Eye, EyeOff } from "lucide-react";
import AuthImagePattern from "../components/AuthImagePattern";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1); // 1: email, 2: security question, 3: new password
    const [email, setEmail] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axiosInstance.post("/auth/forgot-password", { email });
            setSecurityQuestion(res.data.securityQuestion);
            setStep(2);
            toast.success("Security question retrieved");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error retrieving security question");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSecurityAnswerSubmit = async (e) => {
        e.preventDefault();
        if (!securityAnswer) {
            toast.error("Please enter your security answer");
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post("/auth/forgot-password", { email, securityAnswer });
            setStep(3);
            toast.success("Security answer verified!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Incorrect security answer");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post("/auth/forgot-password", { email, securityAnswer, newPassword });
            toast.success("Password reset successfully!");
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error resetting password");
        } finally {
            setIsLoading(false);
        }
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
                            <h1 className="text-2xl font-bold mt-2">Reset Password</h1>
                            <p className="text-base-content/60">
                                {step === 1 && "Enter your email to continue"}
                                {step === 2 && "Answer your security question"}
                                {step === 3 && "Enter your new password"}
                            </p>
                        </div>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                                        className="input input-bordered w-full pl-10"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                                {isLoading ? "Loading..." : "Continue"}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSecurityAnswerSubmit} className="space-y-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Security Question</span>
                                </label>
                                <div className="alert">
                                    <span>{securityQuestion}</span>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Your Answer</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Enter your answer"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                                {isLoading ? "Verifying..." : "Verify Answer"}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handlePasswordReset} className="space-y-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">New Password</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="size-5 text-base-content/40" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input input-bordered w-full pl-10"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-5 text-base-content/40" />
                                        ) : (
                                            <Eye className="size-5 text-base-content/40" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    )}

                    <div className="text-center">
                        <Link to="/login" className="link link-primary">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
            <AuthImagePattern
                title="Reset your password"
                subtitle="Answer your security question to reset your password"
            />
        </div>
    );
};
export default ForgotPasswordPage;

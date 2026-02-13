import React, { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { Shield, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const SecurityQuestionSetup = ({ onSuccess }) => {
  const { authUser } = useAuthStore();
  const [formData, setFormData] = useState({
    securityQuestion: "",
    securityAnswer: ""
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const securityQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite book?"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.securityQuestion || !formData.securityAnswer) {
      return toast.error("Please fill in all fields");
    }

    setIsLoading(true);
    try {
      await axiosInstance.put("/auth/set-security-question", formData);
      toast.success("Security question set successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set security question");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if user already has security question
  if (authUser?.securityQuestion) {
    return (
      <div className="alert alert-success">
        <Shield className="size-5" />
        <span>Security question already set up!</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="alert alert-warning">
        <Shield className="size-5" />
        <div className="text-left">
          <p className="font-bold">Setup Security Question</p>
          <p className="text-xs">Required for password recovery</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Security Question</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={formData.securityQuestion}
            onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
            required
          >
            <option value="">Choose a question...</option>
            {securityQuestions.map((q, i) => (
              <option key={i} value={q}>{q}</option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Your Answer</span>
          </label>
          <div className="relative">
            <input
              type={showAnswer ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              placeholder="Your answer"
              value={formData.securityAnswer}
              onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? <EyeOff className="size-5 text-base-content/40" /> : <Eye className="size-5 text-base-content/40" />}
            </button>
          </div>
          <label className="label">
            <span className="label-text-alt">This will be used to recover your password</span>
          </label>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? "Setting up..." : "Save Security Question"}
        </button>
      </form>
    </div>
  );
};

export default SecurityQuestionSetup;

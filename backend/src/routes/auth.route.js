import express from "express";
import { checkAuth, login, logout, signup, updateProfile, deleteAccount, restoreAccount, blockUser, unblockUser, updateEmailVisibility, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/restore-account", restoreAccount);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-email-visibility", protectRoute, updateEmailVisibility);
router.delete("/delete-account", protectRoute, deleteAccount);

router.post("/block/:userId", protectRoute, blockUser);
router.post("/unblock/:userId", protectRoute, unblockUser);

router.get("/check", protectRoute, checkAuth);

export default router;

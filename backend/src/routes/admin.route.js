import express from "express";
import { getAllUsers, resetUserPassword } from "../controllers/admin.controller.js";
import { updateVersion, deleteVersion } from "../controllers/version.controller.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// All admin routes require token verification
router.get("/users", verifyAdmin, getAllUsers);
router.post("/reset-password", verifyAdmin, resetUserPassword);
router.post("/version", verifyAdmin, updateVersion);
router.delete("/version", verifyAdmin, deleteVersion); // New route

export default router;

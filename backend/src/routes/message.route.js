import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, deleteChat, reactToMessage, removeReaction, deleteMessage, unsendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/chat/:userId", protectRoute, deleteChat);

router.post("/:messageId/react", protectRoute, reactToMessage);
router.delete("/:messageId/react", protectRoute, removeReaction);

router.delete("/:messageId/delete", protectRoute, deleteMessage);
router.delete("/:messageId/unsend", protectRoute, unsendMessage);

export default router;

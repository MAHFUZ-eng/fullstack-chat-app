import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createGroup, getGroups, getGroupMessages, sendGroupMessage, renameGroup, addGroupMember, removeGroupMember } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/send", protectRoute, sendGroupMessage);
router.put("/:groupId/rename", protectRoute, renameGroup);
router.post("/:groupId/add", protectRoute, addGroupMember);
router.post("/:groupId/remove", protectRoute, removeGroupMember);

export default router;

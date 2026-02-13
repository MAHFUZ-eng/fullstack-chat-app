import express from "express";
import { getLatestVersion } from "../controllers/version.controller.js";

const router = express.Router();

router.get("/latest", getLatestVersion);

export default router;

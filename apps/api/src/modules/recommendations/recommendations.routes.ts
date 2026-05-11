import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  dashboardHandler,
  lockHandler,
  historyHandler,
} from "./recommendations.controller.js";

const router = Router();

router.get("/", requireAuth, historyHandler);
router.post("/lock", requireAuth, lockHandler);

export default router;

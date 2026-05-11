import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { statsHandler, userListHandler, userDetailHandler } from "./admin.controller.js";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

router.get("/stats", asyncHandler(statsHandler));
router.get("/users", asyncHandler(userListHandler));
router.get("/users/:id", asyncHandler(userDetailHandler));

export default router;

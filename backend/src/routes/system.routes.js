import { Router } from "express";
import { systemController } from "../controllers/system.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/health", systemController.health);
router.get("/roles", authenticate, systemController.roles);
router.get("/statuses", authenticate, systemController.statuses);

export default router;
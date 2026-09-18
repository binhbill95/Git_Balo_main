import { Router } from "express";
import { aiController } from "./ai.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";

const router = Router();

/**
 * Các endpoint AI (mock) - chuẩn bị cho tương lai
 */
router.post("/chat", authenticate, aiController.chat);
router.get("/recommendation", authenticate, aiController.recommendation);
router.get("/analytics", authenticate, authorize("ADMIN", "MANAGER"), aiController.analytics);
router.get("/forecast", authenticate, authorize("ADMIN", "MANAGER"), aiController.forecast);

export default router;
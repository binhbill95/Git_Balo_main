import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginLimiter, authLimiter } from "../middleware/rateLimit.middleware.js";
import { authSchemas } from "../validations/index.js";

const router = Router();

router.post("/login", loginLimiter, validate(authSchemas.login), authController.login);
router.post("/refresh", authLimiter, validate(authSchemas.refresh), authController.refresh);

router.get("/me", authenticate, authController.me);
router.post(
  "/change-password",
  authenticate,
  authLimiter,
  validate(authSchemas.changePassword),
  authController.changePassword
);
router.post("/logout", authenticate, authController.logout);

export default router;
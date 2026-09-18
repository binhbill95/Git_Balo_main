import { Router } from "express";
import { appSettingController } from "../controllers/appSetting.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { appSettingSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/public", appSettingController.getPublic);
router.put("/", authorize("ADMIN"), validate(appSettingSchemas.update), appSettingController.update);

export default router;
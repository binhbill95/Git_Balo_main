import { Router } from "express";
import { upload } from "../config/upload.js";
import { uploadController } from "../controllers/upload.controller.js";
import { authenticate, authorize } from "../middleware/index.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("ADMIN"), upload.single("file"), uploadController.uploadImage);

export default router;
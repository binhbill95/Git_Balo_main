import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { categorySchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/all", categoryController.listAll);
router.get("/", categoryController.list);
router.get("/:id", categoryController.getById);

router.post("/", authorize("ADMIN"), validate(categorySchemas.create), categoryController.create);
router.put("/:id", authorize("ADMIN"), validate(categorySchemas.update), categoryController.update);
router.delete("/:id", authorize("ADMIN"), categoryController.remove);

export default router;
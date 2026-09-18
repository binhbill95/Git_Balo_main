import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { userSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", userController.list);
router.get("/:id", userController.getById);
router.post("/", validate(userSchemas.create), userController.create);
router.put("/:id", validate(userSchemas.update), userController.update);
router.delete("/:id", userController.remove);

export default router;
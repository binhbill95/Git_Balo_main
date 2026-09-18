import { Router } from "express";
import { customerController } from "../controllers/customer.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { customerSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/", customerController.list);
router.get("/:id", customerController.getById);

router.post("/", authorize("ADMIN", "SALES"), validate(customerSchemas.create), customerController.create);
router.put("/:id", authorize("ADMIN", "SALES"), validate(customerSchemas.update), customerController.update);
router.delete("/:id", authorize("ADMIN"), customerController.remove);

export default router;
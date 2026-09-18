import { Router } from "express";
import { supplierController } from "../controllers/supplier.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { supplierSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/", supplierController.list);
router.get("/all", supplierController.getAll);
router.get("/:id", supplierController.getById);

router.post("/", authorize("ADMIN", "WAREHOUSE"), validate(supplierSchemas.create), supplierController.create);
router.put("/:id", authorize("ADMIN", "WAREHOUSE"), validate(supplierSchemas.update), supplierController.update);
router.delete("/:id", authorize("ADMIN"), supplierController.remove);

export default router;
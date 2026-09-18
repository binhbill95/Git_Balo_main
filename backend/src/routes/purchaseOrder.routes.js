import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { purchaseOrderSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN", "WAREHOUSE", "MANAGER"), purchaseOrderController.list);
router.get("/:id", authorize("ADMIN", "WAREHOUSE", "MANAGER"), purchaseOrderController.getById);

router.post("/", authorize("ADMIN", "WAREHOUSE"), validate(purchaseOrderSchemas.create), purchaseOrderController.create);
router.patch(
  "/:id/status",
  authorize("ADMIN", "WAREHOUSE"),
  validate(purchaseOrderSchemas.updateStatus),
  purchaseOrderController.updateStatus
);

export default router;
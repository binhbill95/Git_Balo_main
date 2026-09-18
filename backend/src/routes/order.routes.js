import { Router } from "express";
import { orderController } from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { orderSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/", orderController.list);
router.get("/:id", orderController.getById);

router.post("/", authorize("ADMIN", "SALES"), validate(orderSchemas.create), orderController.create);
router.patch(
  "/:id/status",
  authorize("ADMIN", "SALES", "WAREHOUSE"),
  validate(orderSchemas.updateStatus),
  orderController.updateStatus
);

export default router;
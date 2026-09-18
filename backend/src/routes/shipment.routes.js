import { Router } from "express";
import { shipmentController } from "../controllers/shipment.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { shipmentSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/", shipmentController.list);
router.get("/:id", shipmentController.getById);

router.post("/", authorize("ADMIN", "SALES"), validate(shipmentSchemas.create), shipmentController.create);
router.put("/:id", authorize("ADMIN", "WAREHOUSE"), validate(shipmentSchemas.update), shipmentController.update);
router.patch(
  "/:id/status",
  authorize("ADMIN", "WAREHOUSE"),
  validate(shipmentSchemas.updateStatus),
  shipmentController.updateStatus
);

export default router;
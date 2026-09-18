import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { productSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/", productController.list);
router.get("/by-barcode/:code", productController.byBarcode);
router.get(
  "/stock-logs",
  authorize("ADMIN", "WAREHOUSE"),
  productController.stockLogs
);
router.post(
  "/import",
  authorize("ADMIN"),
  validate(productSchemas.importMany),
  productController.importMany
);
router.get("/:id", productController.getById);

router.post("/", authorize("ADMIN"), validate(productSchemas.create), productController.create);
router.put("/:id", authorize("ADMIN"), validate(productSchemas.update), productController.update);
router.delete("/:id", authorize("ADMIN"), productController.remove);
router.patch(
  "/:id/stock",
  authorize("ADMIN", "WAREHOUSE"),
  validate(productSchemas.adjustStock),
  productController.adjustStock
);

export default router;
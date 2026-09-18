import { Router } from "express";
import { reportController } from "../controllers/report.controller.js";
import { authenticate, authorize } from "../middleware/index.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard", authorize("ADMIN", "MANAGER", "SALES"), reportController.dashboard);
router.get(
  "/monthly-revenue",
  authorize("ADMIN", "MANAGER", "SALES"),
  reportController.monthlyRevenue
);
router.get("/top-products", authorize("ADMIN", "MANAGER"), reportController.topProducts);
router.get(
  "/inventory",
  authorize("ADMIN", "MANAGER", "WAREHOUSE"),
  reportController.inventory
);
router.get(
  "/end-of-day",
  authorize("ADMIN", "MANAGER", "SALES"),
  reportController.endOfDay
);
router.get("/customers", authorize("ADMIN", "MANAGER"), reportController.customers);

export default router;
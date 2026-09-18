import { Router } from "express";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import customerRoutes from "./customer.routes.js";
import orderRoutes from "./order.routes.js";
import userRoutes from "./user.routes.js";
import deliveryPartnerRoutes from "./deliveryPartner.routes.js";
import shipmentRoutes from "./shipment.routes.js";
import supplierRoutes from "./supplier.routes.js";
import purchaseOrderRoutes from "./purchaseOrder.routes.js";
import reportRoutes from "./report.routes.js";
import systemRoutes from "./system.routes.js";
import uploadRoutes from "./upload.routes.js";
import aiRoutes from "../modules/ai/ai.routes.js";
import appSettingRoutes from "./appSetting.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/customers", customerRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/delivery-partners", deliveryPartnerRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);
router.use("/reports", reportRoutes);
router.use("/system", systemRoutes);
router.use("/uploads", uploadRoutes);
router.use("/ai", aiRoutes);
router.use("/settings", appSettingRoutes);

export default router;
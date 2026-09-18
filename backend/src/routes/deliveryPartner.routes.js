import { Router } from "express";
import { deliveryPartnerController } from "../controllers/deliveryPartner.controller.js";
import { authenticate, authorize } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import { deliveryPartnerSchemas } from "../validations/index.js";

const router = Router();

router.use(authenticate);

router.get("/all", deliveryPartnerController.listAll);
router.get("/", deliveryPartnerController.list);
router.get("/:id", deliveryPartnerController.getById);

router.post("/", authorize("ADMIN"), validate(deliveryPartnerSchemas.create), deliveryPartnerController.create);
router.put("/:id", authorize("ADMIN"), validate(deliveryPartnerSchemas.update), deliveryPartnerController.update);
router.delete("/:id", authorize("ADMIN"), deliveryPartnerController.remove);

export default router;
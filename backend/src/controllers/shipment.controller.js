import { shipmentService } from "../services/shipment.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const shipmentController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, status, partnerId, orderId, from, to } = req.query;
    const result = await shipmentService.list({
      page,
      limit,
      search,
      status,
      partnerId,
      orderId,
      from,
      to,
    });
    return successResponse(
      res,
      200,
      "Lấy danh sách vận đơn thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const shipment = await shipmentService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy chi tiết vận đơn thành công", shipment);
  }),

  create: asyncHandler(async (req, res) => {
    const shipment = await shipmentService.create(req.body);
    return successResponse(res, 201, "Tạo vận đơn thành công", shipment);
  }),

  update: asyncHandler(async (req, res) => {
    const shipment = await shipmentService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật vận đơn thành công", shipment);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const shipment = await shipmentService.updateStatus(Number(req.params.id), req.body.status);
    return successResponse(res, 200, "Cập nhật trạng thái vận đơn thành công", shipment);
  }),
};
import { purchaseOrderService } from "../services/purchaseOrder.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const purchaseOrderController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, status, supplierId, from, to } = req.query;
    const result = await purchaseOrderService.list({ page, limit, search, status, supplierId, from, to });
    return successResponse(
      res,
      200,
      "Lấy danh sách đơn nhập hàng thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy chi tiết đơn nhập hàng thành công", po);
  }),

  create: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.create({ ...req.body, userId: req.user.id });
    return successResponse(res, 201, "Tạo đơn nhập hàng thành công", po);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.updateStatus(Number(req.params.id), req.body.status, req.user.id);
    return successResponse(res, 200, "Cập nhật trạng thái đơn nhập hàng thành công", po);
  }),
};
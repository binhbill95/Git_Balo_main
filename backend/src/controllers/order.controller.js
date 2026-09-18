import { orderService } from "../services/order.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const orderController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, status, customerId, from, to } = req.query;
    const result = await orderService.list({
      page,
      limit,
      search,
      status,
      customerId,
      from,
      to,
    });
    return successResponse(
      res,
      200,
      "Lấy danh sách đơn hàng thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const order = await orderService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy chi tiết đơn hàng thành công", order);
  }),

  create: asyncHandler(async (req, res) => {
    const order = await orderService.create({
      userId: req.user.id,
      customerId: req.body.customerId,
      items: req.body.items,
      note: req.body.note,
      paymentMethod: req.body.paymentMethod,
    });
    return successResponse(res, 201, "Tạo đơn hàng thành công", order);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const order = await orderService.updateStatus(
      Number(req.params.id),
      req.body.status,
      req.user.id
    );
    return successResponse(res, 200, "Cập nhật trạng thái đơn hàng thành công", order);
  }),
};
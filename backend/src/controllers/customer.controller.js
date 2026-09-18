import { customerService } from "../services/customer.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const customerController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search } = req.query;
    const result = await customerService.list({ page, limit, search });
    return successResponse(
      res,
      200,
      "Lấy danh sách khách hàng thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const customer = await customerService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy khách hàng thành công", customer);
  }),

  create: asyncHandler(async (req, res) => {
    const customer = await customerService.create(req.body);
    return successResponse(res, 201, "Tạo khách hàng thành công", customer);
  }),

  update: asyncHandler(async (req, res) => {
    const customer = await customerService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật khách hàng thành công", customer);
  }),

  remove: asyncHandler(async (req, res) => {
    await customerService.remove(Number(req.params.id));
    return successResponse(res, 200, "Xóa khách hàng thành công");
  }),
};
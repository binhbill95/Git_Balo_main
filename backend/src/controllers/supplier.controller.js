import { supplierService } from "../services/supplier.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const supplierController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, isActive } = req.query;
    const result = await supplierService.list({ page, limit, search, isActive });
    return successResponse(
      res,
      200,
      "Lấy danh sách nhà cung cấp thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getAll: asyncHandler(async (req, res) => {
    const suppliers = await supplierService.getAll();
    return successResponse(res, 200, "Lấy danh sách nhà cung cấp thành công", suppliers);
  }),

  getById: asyncHandler(async (req, res) => {
    const supplier = await supplierService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy thông tin nhà cung cấp thành công", supplier);
  }),

  create: asyncHandler(async (req, res) => {
    const supplier = await supplierService.create(req.body);
    return successResponse(res, 201, "Tạo nhà cung cấp thành công", supplier);
  }),

  update: asyncHandler(async (req, res) => {
    const supplier = await supplierService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật nhà cung cấp thành công", supplier);
  }),

  remove: asyncHandler(async (req, res) => {
    const supplier = await supplierService.remove(Number(req.params.id));
    return successResponse(res, 200, "Xóa nhà cung cấp thành công", supplier);
  }),
};
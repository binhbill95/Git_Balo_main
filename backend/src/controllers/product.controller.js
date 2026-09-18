import { productService } from "../services/product.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const productController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, categoryId, minStock, isActive } = req.query;
    const result = await productService.list({
      page,
      limit,
      search,
      categoryId,
      minStock,
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
    return successResponse(
      res,
      200,
      "Lấy danh sách sản phẩm thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await productService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy sản phẩm thành công", product);
  }),

  byBarcode: asyncHandler(async (req, res) => {
    const product = await productService.getByBarcode(req.params.code);
    return successResponse(res, 200, "Tìm sản phẩm theo mã vạch thành công", product);
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productService.create(req.body);
    return successResponse(res, 201, "Tạo sản phẩm thành công", product);
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật sản phẩm thành công", product);
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.remove(Number(req.params.id));
    return successResponse(res, 200, "Xóa sản phẩm thành công");
  }),

  adjustStock: asyncHandler(async (req, res) => {
    const product = await productService.adjustStock({
      productId: req.params.id || req.body.productId,
      newStock: req.body.newStock,
      userId: req.user.id,
      note: req.body.note,
    });
    return successResponse(res, 200, "Cập nhật tồn kho thành công", product);
  }),

  stockLogs: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { productId, userId } = req.query;
    const result = await productService.getStockLogs({ page, limit, productId, userId });
    return successResponse(
      res,
      200,
      "Lấy lịch sử tồn kho thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  importMany: asyncHandler(async (req, res) => {
    const result = await productService.importMany(req.body.items);
    return successResponse(res, 201, "Import sản phẩm hoàn tất", result);
  }),
};
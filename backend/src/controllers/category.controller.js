import { categoryService } from "../services/category.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";
import { toSlug } from "../utils/slugify.js";

export const categoryController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, isActive } = req.query;
    const result = await categoryService.list({
      page,
      limit,
      search,
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
    return successResponse(
      res,
      200,
      "Lấy danh sách danh mục thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  listAll: asyncHandler(async (req, res) => {
    const items = await categoryService.listAll();
    return successResponse(res, 200, "Lấy tất cả danh mục thành công", items);
  }),

  getById: asyncHandler(async (req, res) => {
    const category = await categoryService.getById(Number(req.params.id));
    if (!category) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }
    return successResponse(res, 200, "Lấy danh mục thành công", category);
  }),

  create: asyncHandler(async (req, res) => {
    const category = await categoryService.create({
      ...req.body,
      slug: req.body.slug || toSlug(req.body.name),
    });
    return successResponse(res, 201, "Tạo danh mục thành công", category);
  }),

  update: asyncHandler(async (req, res) => {
    const category = await categoryService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật danh mục thành công", category);
  }),

  remove: asyncHandler(async (req, res) => {
    await categoryService.remove(Number(req.params.id));
    return successResponse(res, 200, "Xóa danh mục thành công");
  }),
};
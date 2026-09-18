import { deliveryPartnerService } from "../services/deliveryPartner.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const deliveryPartnerController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, isActive } = req.query;
    const result = await deliveryPartnerService.list({
      page,
      limit,
      search,
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
    return successResponse(
      res,
      200,
      "Lấy danh sách đối tác giao hàng thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  listAll: asyncHandler(async (req, res) => {
    const { isActive } = req.query;
    const items = await deliveryPartnerService.listAll({
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
    return successResponse(res, 200, "Lấy tất cả đối tác giao hàng thành công", items);
  }),

  getById: asyncHandler(async (req, res) => {
    const partner = await deliveryPartnerService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy đối tác giao hàng thành công", partner);
  }),

  create: asyncHandler(async (req, res) => {
    const partner = await deliveryPartnerService.create(req.body);
    return successResponse(res, 201, "Tạo đối tác giao hàng thành công", partner);
  }),

  update: asyncHandler(async (req, res) => {
    const partner = await deliveryPartnerService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật đối tác giao hàng thành công", partner);
  }),

  remove: asyncHandler(async (req, res) => {
    await deliveryPartnerService.remove(Number(req.params.id));
    return successResponse(res, 200, "Xóa đối tác giao hàng thành công");
  }),
};
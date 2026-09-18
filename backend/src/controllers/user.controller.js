import { userService } from "../services/user.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, getPagination } from "../utils/pagination.js";

export const userController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req);
    const { search, roleId } = req.query;
    const result = await userService.list({ page, limit, search, roleId });
    return successResponse(
      res,
      200,
      "Lấy danh sách tài khoản thành công",
      result.items,
      buildMeta(result.total, page, limit)
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const user = await userService.getById(Number(req.params.id));
    return successResponse(res, 200, "Lấy tài khoản thành công", user);
  }),

  create: asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    return successResponse(res, 201, "Tạo tài khoản thành công", {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      isActive: user.isActive,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const user = await userService.update(Number(req.params.id), req.body);
    return successResponse(res, 200, "Cập nhật tài khoản thành công", user);
  }),

  remove: asyncHandler(async (req, res) => {
    await userService.remove(Number(req.params.id));
    return successResponse(res, 200, "Vô hiệu hóa tài khoản thành công");
  }),
};
import { authService } from "../services/auth.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authController = {
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return successResponse(res, 200, "Đăng nhập thành công", result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    return successResponse(res, 200, "Refresh token thành công", result);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, 200, "Lấy thông tin người dùng thành công", user);
  }),

  changePassword: asyncHandler(async (req, res) => {
    await authService.changePassword(req.user.id, req.body);
    return successResponse(res, 200, "Đổi mật khẩu thành công");
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    return successResponse(res, 200, "Đăng xuất thành công");
  }),
};
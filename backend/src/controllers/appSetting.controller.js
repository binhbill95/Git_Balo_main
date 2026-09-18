import { appSettingService } from "../services/appSetting.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const appSettingController = {
  getPublic: asyncHandler(async (req, res) => {
    const settings = await appSettingService.getPublic();
    return successResponse(res, 200, "Lấy cài đặt công khai thành công", settings);
  }),

  update: asyncHandler(async (req, res) => {
    const settings = await appSettingService.update(req.body);
    return successResponse(res, 200, "Cập nhật cài đặt thành công", settings);
  }),
};
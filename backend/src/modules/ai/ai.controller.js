import { aiService } from "./ai.service.js";
import { successResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const aiController = {
  chat: asyncHandler(async (req, res) => {
    const result = await aiService.chat({ message: req.body.message, userId: req.user?.id });
    return successResponse(res, 200, "OK", result);
  }),

  recommendation: asyncHandler(async (req, res) => {
    const result = await aiService.recommendation({
      userId: req.user?.id,
      limit: Number(req.query.limit) || 4,
    });
    return successResponse(res, 200, "OK", result);
  }),

  analytics: asyncHandler(async (req, res) => {
    const result = await aiService.analytics();
    return successResponse(res, 200, "OK", result);
  }),

  forecast: asyncHandler(async (req, res) => {
    const result = await aiService.forecast({ productId: Number(req.query.productId) });
    return successResponse(res, 200, "OK", result);
  }),
};
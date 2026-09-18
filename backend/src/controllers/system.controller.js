import prisma from "../config/prisma.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const systemController = {
  roles: asyncHandler(async (req, res) => {
    const roles = await prisma.role.findMany({ orderBy: { id: "asc" } });
    return successResponse(res, 200, "Lấy danh sách role thành công", roles);
  }),

  statuses: asyncHandler(async (req, res) => {
    return successResponse(res, 200, "Lấy danh sách trạng thái thành công", [
      "PENDING",
      "CONFIRMED",
      "SHIPPING",
      "COMPLETED",
      "CANCELLED",
    ]);
  }),

  health: asyncHandler(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    return successResponse(res, 200, "OK");
  }),
};
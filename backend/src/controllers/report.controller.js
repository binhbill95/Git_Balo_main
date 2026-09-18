import { reportService } from "../services/report.service.js";
import { successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportController = {
  dashboard: asyncHandler(async (req, res) => {
    const summary = await reportService.dashboardSummary();
    return successResponse(res, 200, "Lấy dữ liệu dashboard thành công", summary);
  }),

  monthlyRevenue: asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const months = await reportService.monthlyRevenue(year);
    return successResponse(res, 200, "Lấy doanh thu theo tháng thành công", months);
  }),

  topProducts: asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 5;
    const { from, to } = req.query;
    const items = await reportService.topProducts(limit, from, to);
    return successResponse(res, 200, "Lấy top sản phẩm bán chạy thành công", items);
  }),

  inventory: asyncHandler(async (req, res) => {
    const result = await reportService.inventory();
    return successResponse(res, 200, "Lấy báo cáo tồn kho thành công", result);
  }),

  endOfDay: asyncHandler(async (req, res) => {
    const result = await reportService.endOfDay(req.query.date);
    return successResponse(res, 200, "Lấy báo cáo cuối ngày thành công", result);
  }),

  customers: asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const result = await reportService.customers({ from, to });
    return successResponse(res, 200, "Lấy báo cáo khách hàng thành công", result);
  }),
};
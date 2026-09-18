import { ApiError } from "../utils/ApiError.js";

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Bạn chưa đăng nhập"));
  }
  if (!roles.includes(req.user.role.name)) {
    return next(new ApiError(403, "Bạn không có quyền thực hiện thao tác này"));
  }
  next();
};
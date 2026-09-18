import { Prisma } from "@prisma/client";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Không tìm thấy route: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === "P2002") {
      message = "Dữ liệu bị trùng lặp (duplicate key)";
      details = { fields: err.meta?.target };
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Không tìm thấy bản ghi yêu cầu";
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Dữ liệu liên quan (foreign key) không hợp lệ";
      details = { field_name: err.meta?.field_name };
    } else {
      details = { code: err.code, meta: err.meta };
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Dữ liệu gửi lên không hợp lệ (validation error)";
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File ảnh quá lớn (tối đa 5MB)"
        : `Lỗi upload file: ${err.message}`;
  }

  const body = { success: false, message };
  if (details) body.details = details;
  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    body.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error("[ERROR]", err);
  }

  return res.status(statusCode).json(body);
};
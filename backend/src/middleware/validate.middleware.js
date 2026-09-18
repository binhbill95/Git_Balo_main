import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.body.safeParse(req.body);
  if (!result.success) {
    const details = (result.error.issues ?? result.error.errors).map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(new ApiError(400, "Dữ liệu không hợp lệ", details));
  }
  req.body = result.data;
  next();
};
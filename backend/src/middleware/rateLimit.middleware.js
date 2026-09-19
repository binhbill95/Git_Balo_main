import rateLimit from "express-rate-limit";

const send429 = (res, message) => {
  res.status(429).json({ success: false, message });
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    send429(res, "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    send429(res, "Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau ít phút."),
});
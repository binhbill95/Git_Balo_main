import { userRepository } from "../repositories/user.repository.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  role: user.role?.name,
  isActive: user.isActive,
});

export const authService = {
  async login({ username, password }) {
    const user = await userRepository.findByUsername(username);
    if (!user || !user.isActive) {
      throw new ApiError(401, "Tên đăng nhập hoặc mật khẩu không đúng");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Tên đăng nhập hoặc mật khẩu không đúng");
    }

    const payload = { userId: user.id, role: user.role.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ ...payload, tokenVersion: Date.now() });

    await userRepository.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user: toPublicUser(user) };
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, "Thiếu refresh token");
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Refresh token hết hạn hoặc không hợp lệ");
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive || !user.refreshToken || user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Refresh token không hợp lệ");
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role.name });
    return { accessToken };
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
    return toPublicUser(user);
  },

  async changePassword(userId, { oldPassword, newPassword }) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) throw new ApiError(400, "Mật khẩu cũ không đúng");

    await userRepository.updatePassword(userId, await hashPassword(newPassword));
    return true;
  },

  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
    return true;
  },
};
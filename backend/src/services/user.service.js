import prisma from "../config/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { hashPassword } from "../utils/password.js";
import { ApiError } from "../utils/ApiError.js";

export const userService = {
  async list({ page, limit, search, roleId }) {
    const where = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleId) where.roleId = Number(roleId);

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      userRepository.findMany({ where, skip, limit }),
      userRepository.count(where),
    ]);
    return {
      items: items.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role.name,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      total,
    };
  },

  async getById(id) {
    const u = await userRepository.findById(Number(id));
    if (!u) throw new ApiError(404, "Không tìm thấy tài khoản");
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role.name,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  },

  async create(data) {
    const byUsername = await userRepository.findByUsername(data.username);
    if (byUsername) throw new ApiError(400, "Tên đăng nhập đã tồn tại");
    const byEmail = await userRepository.findByEmail(data.email);
    if (byEmail) throw new ApiError(400, "Email đã tồn tại");

    const role = await prisma.role.findUnique({ where: { name: data.role } });
    if (!role) throw new ApiError(400, "Role không hợp lệ");

    const u = await userRepository.create({
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      password: await hashPassword(data.password),
      roleId: role.id,
    });
    return u;
  },

  async update(id, data) {
    const user = await userRepository.findById(Number(id));
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");

    if (data.role) {
      const role = await prisma.role.findUnique({ where: { name: data.role } });
      if (!role) throw new ApiError(400, "Role không hợp lệ");
      data.roleId = role.id;
      delete data.role;
    }
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    return userRepository.update(Number(id), data);
  },

  async remove(id) {
    const user = await userRepository.findById(Number(id));
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
    if (user.username === "admin") throw new ApiError(400, "Không thể xóa tài khoản admin gốc");
    return userRepository.update(Number(id), { isActive: false });
  },
};
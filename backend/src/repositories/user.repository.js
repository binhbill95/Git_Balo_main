import prisma from "../config/prisma.js";

export const userRepository = {
  create: (data) => prisma.user.create({ data }),

  findByUsername: (username) =>
    prisma.user.findUnique({ where: { username }, include: { role: true } }),

  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),

  findById: (id) => prisma.user.findUnique({ where: { id }, include: { role: true } }),

  update: (id, data) => prisma.user.update({ where: { id }, data }),

  updateRefreshToken: (id, refreshToken) =>
    prisma.user.update({ where: { id }, data: { refreshToken } }),

  findMany: ({ where, skip, limit, orderBy }) =>
    prisma.user.findMany({ where, skip, take: limit, orderBy, include: { role: true } }),

  count: (where = {}) => prisma.user.count({ where }),

  updatePassword: (id, password) =>
    prisma.user.update({ where: { id }, data: { password } }),
};
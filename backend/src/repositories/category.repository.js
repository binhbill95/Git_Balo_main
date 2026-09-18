import prisma from "../config/prisma.js";

export const categoryRepository = {
  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.category.findMany({ where, skip, take: limit, orderBy }),

  count: (where = {}) => prisma.category.count({ where }),

  findById: (id) => prisma.category.findUnique({ where: { id } }),

  findBySlug: (slug) => prisma.category.findUnique({ where: { slug } }),

  create: (data) => prisma.category.create({ data }),

  update: (id, data) => prisma.category.update({ where: { id }, data }),

  remove: (id) => prisma.category.delete({ where: { id } }),
};
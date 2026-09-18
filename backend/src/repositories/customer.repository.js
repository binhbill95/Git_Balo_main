import prisma from "../config/prisma.js";

export const customerRepository = {
  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.customer.findMany({ where, skip, take: limit, orderBy }),

  count: (where = {}) => prisma.customer.count({ where }),

  findById: (id) => prisma.customer.findUnique({ where: { id } }),

  findByPhone: (phone) => prisma.customer.findUnique({ where: { phone } }),

  create: (data) => prisma.customer.create({ data }),

  update: (id, data) => prisma.customer.update({ where: { id }, data }),

  remove: (id) => prisma.customer.delete({ where: { id } }),
};
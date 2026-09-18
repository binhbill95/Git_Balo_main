import prisma from "../config/prisma.js";

export const stockLogRepository = {
  create: (data) => prisma.stockLog.create({ data }),

  createMany: (data) => prisma.stockLog.createMany({ data }),

  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.stockLog.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { product: { select: { id: true, name: true, sku: true } }, user: { select: { id: true, fullName: true } } },
    }),

  count: (where = {}) => prisma.stockLog.count({ where }),
};
import prisma from "../config/prisma.js";

export const supplierRepository = {
  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { _count: { select: { purchaseOrders: true } } },
    }),

  findAll: (where = {}, orderBy = { name: "asc" }) =>
    prisma.supplier.findMany({
      where,
      orderBy,
      include: { _count: { select: { purchaseOrders: true } } },
    }),

  count: (where = {}) => prisma.supplier.count({ where }),

  findById: (id) =>
    prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true } } },
    }),

  findByCodeOrName: (code, name) =>
    prisma.supplier.findFirst({
      where: { OR: [{ code }, { name }] },
    }),

  create: (data) => prisma.supplier.create({ data }),

  update: (id, data) => prisma.supplier.update({ where: { id }, data }),

  remove: (id) => prisma.supplier.delete({ where: { id } }),
};
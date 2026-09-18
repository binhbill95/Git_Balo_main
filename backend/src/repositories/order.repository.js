import prisma from "../config/prisma.js";

export const orderRepository = {
  findMany: ({ where, skip, limit, orderBy = { createdAt: "desc" } }) =>
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        user: { select: { id: true, username: true, fullName: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    }),

  count: (where = {}) => prisma.order.count({ where }),

  findById: (id) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, username: true, fullName: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, sku: true, slug: true } } },
        },
      },
    }),

  create: (data) => prisma.order.create({ data }),

  updateStatus: (id, status) =>
    prisma.order.update({ where: { id }, data: { status } }),

  remove: (id) => prisma.order.delete({ where: { id } }),

  aggregateTotals: (where = {}) =>
    prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: true,
    }),

  transaction: (fn) => prisma.$transaction(fn),
};
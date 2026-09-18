import prisma from "../config/prisma.js";

export const productRepository = {
  findMany: ({ where, skip, limit, orderBy = { createdAt: "desc" } }) =>
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),

  findAll: (where = {}) =>
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),

  count: (where = {}) => prisma.product.count({ where }),

  findById: (id) =>
    prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),

  findBySku: (sku) => prisma.product.findUnique({ where: { sku } }),

  findByBarcode: (barcode) => prisma.product.findUnique({ where: { barcode } }),

  create: (data) => prisma.product.create({ data }),

  update: (id, data) => prisma.product.update({ where: { id }, data }),

  remove: (id) => prisma.product.delete({ where: { id } }),

  adjustStock: (id, newStock) =>
    prisma.product.update({ where: { id }, data: { stock: newStock } }),

  transaction: (fn) => prisma.$transaction(fn),
};
import prisma from "../config/prisma.js";

export const PURCHASE_ORDER_INCLUDE = {
  supplier: {
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      taxCode: true,
    },
  },
  user: { select: { id: true, username: true, fullName: true } },
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          color: true,
          price: true,
          costPrice: true,
        },
      },
    },
  },
};

export const purchaseOrderRepository = {
  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: PURCHASE_ORDER_INCLUDE,
    }),

  count: (where = {}) => prisma.purchaseOrder.count({ where }),

  findById: (id) =>
    prisma.purchaseOrder.findUnique({ where: { id }, include: PURCHASE_ORDER_INCLUDE }),

  findByCode: (poCode) => prisma.purchaseOrder.findUnique({ where: { poCode } }),

  create: ({ items, ...data }) =>
    prisma.purchaseOrder.create({
      data: {
        ...data,
        items: { create: items },
      },
      include: PURCHASE_ORDER_INCLUDE,
    }),

  updateStatus: (id, status, receivedAt = null) =>
    prisma.purchaseOrder.update({
      where: { id },
      data: { status, receivedAt: receivedAt || undefined },
      include: PURCHASE_ORDER_INCLUDE,
    }),

  transaction: (fn) => prisma.$transaction(fn),
};
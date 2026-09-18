import prisma from "../config/prisma.js";

const SHIPMENT_INCLUDE = {
  order: {
    include: {
      customer: { select: { id: true, fullName: true, phone: true, address: true } },
      user: { select: { id: true, username: true, fullName: true } },
    },
  },
  partner: true,
};

export const shipmentRepository = {
  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.shipment.findMany({ where, skip, take: limit, orderBy, include: SHIPMENT_INCLUDE }),

  count: (where = {}) => prisma.shipment.count({ where }),

  findById: (id) => prisma.shipment.findUnique({ where: { id }, include: SHIPMENT_INCLUDE }),

  findByCode: (shipmentCode) => prisma.shipment.findUnique({ where: { shipmentCode } }),

  findActiveByOrderId: (orderId) =>
    prisma.shipment.findFirst({
      where: {
        orderId,
        status: { notIn: ["DELIVERED", "FAILED"] },
      },
      orderBy: { createdAt: "desc" },
    }),

  create: (data) =>
    prisma.shipment.create({
      data,
      include: SHIPMENT_INCLUDE,
    }),

  update: (id, data) =>
    prisma.shipment.update({
      where: { id },
      data,
      include: SHIPMENT_INCLUDE,
    }),

  updateStatus: (id, status, deliveredAt = null) =>
    prisma.shipment.update({
      where: { id },
      data: { status, deliveredAt: deliveredAt || undefined },
      include: SHIPMENT_INCLUDE,
    }),

  transaction: (fn) => prisma.$transaction(fn),
};
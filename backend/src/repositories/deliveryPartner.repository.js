import prisma from "../config/prisma.js";

export const deliveryPartnerRepository = {
  findMany: ({ where = {}, skip = 0, limit = 20, orderBy = { createdAt: "desc" } }) =>
    prisma.deliveryPartner.findMany({ where, skip, take: limit, orderBy, include: { _count: { select: { shipments: true } } } }),

  findAll: (where = {}, orderBy = { name: "asc" }) =>
    prisma.deliveryPartner.findMany({ where, orderBy, include: { _count: { select: { shipments: true } } } }),

  count: (where = {}) => prisma.deliveryPartner.count({ where }),

  findById: (id) =>
    prisma.deliveryPartner.findUnique({
      where: { id },
      include: { _count: { select: { shipments: true } } },
    }),

  findByCodeOrName: (code, name) =>
    prisma.deliveryPartner.findFirst({
      where: { OR: [{ code }, { name }] },
    }),

  create: (data) => prisma.deliveryPartner.create({ data }),

  update: (id, data) => prisma.deliveryPartner.update({ where: { id }, data }),

  remove: (id) => prisma.deliveryPartner.delete({ where: { id } }),
};
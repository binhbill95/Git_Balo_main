import prisma from "../config/prisma.js";

export const appSettingRepository = {
  findMany: ({ where = {}, orderBy = { key: "asc" } } = {}) =>
    prisma.appSetting.findMany({ where, orderBy }),

  findByKey: (key) => prisma.appSetting.findUnique({ where: { key } }),

  upsert: (key, value) =>
    prisma.appSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value },
    }),
};
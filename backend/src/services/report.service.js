import prisma from "../config/prisma.js";

const EXCLUDED_STATUS = ["CANCELLED"];

export const reportService = {
  async dashboardSummary() {
    const [totalProducts, totalCustomers, totalOrders, revenueAgg] = await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count({ where: { status: { notIn: EXCLUDED_STATUS } } }),
      prisma.order.aggregate({
        where: { status: { notIn: EXCLUDED_STATUS } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalProducts,
      totalCustomers,
      totalOrders,
      revenue: revenueAgg._sum.totalAmount || 0,
    };
  },

  async monthlyRevenue(year) {
    const start = new Date(`${year}-01-01T00:00:00`);
    const end = new Date(`${year + 1}-01-01T00:00:00`);

    const rows = await prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: start, lt: end }, status: { notIn: EXCLUDED_STATUS } },
      _sum: { totalAmount: true },
      _count: true,
    });

    const months = [];
    for (let i = 1; i <= 12; i += 1) {
      const bucketRows = rows.filter((r) => new Date(r.createdAt).getMonth() === i - 1);
      months.push({
        month: i,
        label: `Tháng ${i}`,
        revenue: bucketRows.reduce((s, r) => s + Number(r._sum.totalAmount), 0),
        orders: bucketRows.reduce((s, r) => s + r._count, 0),
      });
    }
    return months;
  },

  async topProducts(limit = 5, from, to) {
    const whereOrder = { status: { notIn: EXCLUDED_STATUS } };
    if (from || to) {
      whereOrder.createdAt = {};
      if (from) whereOrder.createdAt.gte = new Date(from);
      if (to) whereOrder.createdAt.lt = new Date(to);
    }

    // Tính đúng doanh thu = tổng(price * quantity) theo từng sản phẩm
    const rows = await prisma.orderItem.findMany({
      where: { order: whereOrder },
      select: { productId: true, quantity: true, price: true },
    });

    const agg = new Map();
    for (const r of rows) {
      const cur = agg.get(r.productId) || { totalSold: 0, revenue: 0 };
      cur.totalSold += r.quantity;
      cur.revenue += Number(r.price) * r.quantity;
      agg.set(r.productId, cur);
    }

    const items = [...agg.entries()]
      .map(([productId, value]) => ({ productId, ...value }))
      .sort((a, b) => b.totalSold - a.totalSold || b.revenue - a.revenue)
      .slice(0, limit);

    if (items.length === 0) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      include: { category: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    return items.map((i) => {
      const p = map.get(i.productId);
      return {
        productId: i.productId,
        name: p?.name || "N/A",
        sku: p?.sku || "",
        category: p?.category?.name || "",
        totalSold: i.totalSold,
        revenue: i.revenue,
      };
    });
  },

  async inventory() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { stock: "asc" },
    });

    const items = products.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || "",
      stock: p.stock,
      price: Number(p.price) || 0,
      costPrice: Number(p.costPrice) || 0,
      stockValue: (Number(p.price) || 0) * p.stock,
      costValue: (Number(p.costPrice) || 0) * p.stock,
    }));

    const totalStock = items.reduce((s, i) => s + i.stock, 0);
    const totalStockValue = items.reduce((s, i) => s + i.stockValue, 0);
    const totalCostValue = items.reduce((s, i) => s + i.costValue, 0);
    const lowStock = items.filter((i) => i.stock > 0 && i.stock < 10);
    const outOfStock = items.filter((i) => i.stock === 0);

    return {
      totalProducts: items.length,
      totalStock,
      totalStockValue,
      totalCostValue,
      potentialProfit: totalStockValue - totalCostValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      items,
    };
  },

  async endOfDay(dateStr) {
    const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { customer: { select: { fullName: true } } },
      orderBy: { createdAt: "asc" },
    });

    const valid = orders.filter((o) => o.status !== "CANCELLED");
    const totalRevenue = valid.reduce((s, o) => s + Number(o.totalAmount), 0);

    const byPaymentMethod = ["CASH", "TRANSFER", "CARD"].map((method) => {
      const list = valid.filter((o) => o.paymentMethod === method);
      return {
        method,
        count: list.length,
        total: list.reduce((s, o) => s + Number(o.totalAmount), 0),
      };
    });

    const statusOrder = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];
    const byStatus = statusOrder
      .map((status) => ({ status, count: orders.filter((o) => o.status === status).length }))
      .filter((s) => s.count > 0);

    const soldRows = await prisma.orderItem.findMany({
      where: { order: { id: { in: valid.map((o) => o.id) } } },
      select: { quantity: true },
    });
    const totalQuantitySold = soldRows.reduce((s, i) => s + i.quantity, 0);

    const localDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

    return {
      date: dateStr || localDate,
      totalRevenue,
      totalOrders: valid.length,
      avgOrderValue: valid.length ? Math.round(totalRevenue / valid.length) : 0,
      totalQuantitySold,
      byPaymentMethod,
      byStatus,
      orders: orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        createdAt: o.createdAt,
        customerName: o.customer?.fullName || "Khách lẻ",
        paymentMethod: o.paymentMethod,
        totalAmount: Number(o.totalAmount),
        status: o.status,
      })),
    };
  },

  async customers({ from, to }) {
    const rangeWhere = {};
    if (from || to) {
      rangeWhere.createdAt = {};
      if (from) rangeWhere.createdAt.gte = new Date(from);
      if (to) {
        const e = new Date(to);
        e.setHours(23, 59, 59, 999);
        rangeWhere.createdAt.lte = e;
      }
    }

    const [totalCustomers, newCustomers, orderRows] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: rangeWhere }),
      prisma.order.findMany({
        where: { status: { notIn: EXCLUDED_STATUS }, ...rangeWhere },
        select: { customerId: true, totalAmount: true, createdAt: true },
      }),
    ]);

    const agg = new Map();
    for (const o of orderRows) {
      const cur = agg.get(o.customerId) || { orderCount: 0, totalSpent: 0, lastOrderAt: null };
      cur.orderCount += 1;
      cur.totalSpent += Number(o.totalAmount);
      if (!cur.lastOrderAt || o.createdAt > cur.lastOrderAt) cur.lastOrderAt = o.createdAt;
      agg.set(o.customerId, cur);
    }

    let topCustomers = [];
    if (agg.size) {
      const customers = await prisma.customer.findMany({
        where: { id: { in: [...agg.keys()] } },
        select: { id: true, fullName: true, phone: true },
      });
      const map = new Map(customers.map((c) => [c.id, c]));
      topCustomers = [...agg.entries()]
        .map(([id, v]) => ({
          customerId: id,
          fullName: map.get(id)?.fullName || "N/A",
          phone: map.get(id)?.phone || "",
          ...v,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount)
        .slice(0, 20);
    }

    return {
      totalCustomers,
      newCustomers,
      activeCustomers: agg.size,
      topCustomers,
    };
  },
};
import { purchaseOrderRepository } from "../repositories/purchaseOrder.repository.js";
import { supplierRepository } from "../repositories/supplier.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { ApiError } from "../utils/ApiError.js";

const PO_STATUSES = ["PENDING", "APPROVED", "RECEIVED", "CANCELLED"];

// Luồng chuyển trạng thái hợp lệ của đơn nhập hàng
const PO_TRANSITIONS = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

const generatePoCode = () => {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PN-${datePart}-${rand}`;
};

export const purchaseOrderService = {
  async list({ page, limit, search, status, supplierId, from, to }) {
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);
    if (search) {
      where.OR = [
        { poCode: { contains: search, mode: "insensitive" } },
        {
          supplier: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      purchaseOrderRepository.findMany({ where, skip, limit }),
      purchaseOrderRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    const po = await purchaseOrderRepository.findById(Number(id));
    if (!po) throw new ApiError(404, "Không tìm thấy đơn nhập hàng");
    return po;
  },

  async create({ supplierId, note, items, userId }) {
    const supplier = await supplierRepository.findById(Number(supplierId));
    if (!supplier) throw new ApiError(404, "Không tìm thấy nhà cung cấp");
    if (!supplier.isActive) throw new ApiError(400, "Nhà cung cấp đang bị tắt hoạt động");

    const productIds = [...new Set(items.map((it) => Number(it.productId)))];
    const products = await productRepository.transaction((tx) =>
      tx.product.findMany({ where: { id: { in: productIds } } })
    );
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const it of items) {
      if (!productMap.has(Number(it.productId))) {
        throw new ApiError(400, `Sản phẩm id=${it.productId} không tồn tại`);
      }
    }

    const lines = items.map((it) => {
      const qty = Number(it.quantity);
      const unitPrice = Number(it.unitPrice);
      if (!Number.isInteger(qty) || qty <= 0) throw new ApiError(400, "Số lượng không hợp lệ");
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new ApiError(400, "Giá nhập không hợp lệ");
      return { productId: Number(it.productId), quantity: qty, unitPrice };
    });

    const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

    return purchaseOrderRepository.create({
      poCode: generatePoCode(),
      supplierId: supplier.id,
      userId,
      totalAmount,
      note: note?.trim() || null,
      items: lines,
    });
  },

  async updateStatus(id, status, userId) {
    const po = await purchaseOrderRepository.findById(Number(id));
    if (!po) throw new ApiError(404, "Không tìm thấy đơn nhập hàng");

    if (!PO_STATUSES.includes(status)) {
      throw new ApiError(400, "Trạng thái đơn nhập không hợp lệ");
    }

    if (po.status !== status) {
      const allowed = PO_TRANSITIONS[po.status] || [];
      if (!allowed.includes(status)) {
        throw new ApiError(400, `Không thể chuyển trạng thái đơn nhập từ ${po.status} sang ${status}`);
      }
    }

    const receiving = status === "RECEIVED" && po.status !== "RECEIVED";

    if (receiving) {
      await purchaseOrderRepository.transaction(async (tx) => {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status, receivedAt: new Date() },
        });

        for (const item of po.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new ApiError(404, `Không tìm thấy sản phẩm id=${item.productId}`);
          const before = product.stock;
          const after = before + item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: after, costPrice: item.unitPrice },
          });
          await tx.stockLog.create({
            data: {
              productId: item.productId,
              userId,
              type: "IMPORT",
              quantity: item.quantity,
              before,
              after,
              note: `Nhập hàng theo đơn ${po.poCode}`,
            },
          });
        }
      });
    } else {
      await purchaseOrderRepository.updateStatus(po.id, status);
    }

    return purchaseOrderRepository.findById(po.id);
  },
};
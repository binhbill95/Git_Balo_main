import { orderRepository } from "../repositories/order.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { ApiError } from "../utils/ApiError.js";

const generateOrderCode = () => {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `OD-${datePart}-${rand}`;
};

const WALK_IN_PHONE = "0000000000";
const WALK_IN_NAME = "Khách lẻ";

// Luồng chuyển trạng thái hợp lệ của đơn hàng
const ORDER_TRANSITIONS = {
  PENDING: ["CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"],
  CONFIRMED: ["SHIPPING", "COMPLETED", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const resolveCustomerId = async (customerId) => {
  if (customerId !== undefined && customerId !== null) {
    const customer = await customerRepository.findById(Number(customerId));
    if (!customer) throw new ApiError(404, "Khách hàng không tồn tại");
    return customer.id;
  }
  let walkIn = await customerRepository.findByPhone(WALK_IN_PHONE);
  if (!walkIn) {
    walkIn = await customerRepository.create({
      fullName: WALK_IN_NAME,
      phone: WALK_IN_PHONE,
      isActive: true,
    });
  }
  return walkIn.id;
};

export const orderService = {
  async list({ page, limit, search, status, customerId, from, to }) {
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = Number(customerId);
    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
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
      orderRepository.findMany({ where, skip, limit }),
      orderRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    const order = await orderRepository.findById(Number(id));
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");
    return order;
  },

  async create({ userId, customerId, items, note, paymentMethod }) {
    if (!items || items.length === 0) {
      throw new ApiError(400, "Đơn hàng phải có ít nhất 1 sản phẩm");
    }

    const resolvedCustomerId = await resolveCustomerId(customerId);
    const orderCode = generateOrderCode();

    const order = await orderRepository.transaction(async (tx) => {
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: Number(item.productId) },
          include: { category: true },
        });
        if (!product) {
          throw new ApiError(404, `Sản phẩm ID ${item.productId} không tồn tại`);
        }
        if (!product.isActive || !product.category?.isActive) {
          throw new ApiError(
            400,
            `Sản phẩm "${product.name}" đang bị ẩn, không thể bán`
          );
        }
        if (product.stock < item.quantity) {
          throw new ApiError(400, `Sản phẩm "${product.name}" không đủ hàng (còn ${product.stock})`);
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });
        await tx.stockLog.create({
          data: {
            productId: product.id,
            userId,
            type: "EXPORT",
            quantity: item.quantity,
            before: product.stock,
            after: product.stock - item.quantity,
            note: "Xuất kho cho đơn hàng",
          },
        });

        const lineTotal = Number(product.price) * item.quantity;
        total = total + lineTotal;
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      const created = await tx.order.create({
        data: {
          orderCode,
          customerId: resolvedCustomerId,
          userId,
          totalAmount: total,
          status: "PENDING",
          paymentMethod,
          note,
          orderItems: { create: orderItems },
        },
        include: { orderItems: { include: { product: true } } },
      });

      return created;
    });

    return orderRepository.findById(order.id);
  },

  async updateStatus(id, status, currentUserId) {
    const order = await orderRepository.findById(Number(id));
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");

    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Trạng thái không hợp lệ");
    }

    if (order.status !== status) {
      const allowed = ORDER_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        throw new ApiError(
          400,
          `Không thể chuyển trạng thái từ ${order.status} sang ${status}`
        );
      }
    }

    // Hủy đơn (chưa hoàn thành) -> hoàn lại toàn bộ tồn kho
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      const restockUserId = currentUserId || order.userId;
      await orderRepository.transaction(async (tx) => {
        for (const item of order.orderItems) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: product.stock + item.quantity },
          });
          await tx.stockLog.create({
            data: {
              productId: item.productId,
              userId: restockUserId,
              type: "CANCEL",
              quantity: item.quantity,
              before: product.stock,
              after: product.stock + item.quantity,
              note: `Hoàn kho khi hủy đơn ${order.orderCode}`,
            },
          });
        }
      });
    }

    return orderRepository.updateStatus(Number(id), status);
  },
};
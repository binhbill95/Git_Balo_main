import { shipmentRepository } from "../repositories/shipment.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { deliveryPartnerRepository } from "../repositories/deliveryPartner.repository.js";
import { ApiError } from "../utils/ApiError.js";

const SHIPMENT_STATUSES = ["PENDING_PICKUP", "IN_TRANSIT", "DELIVERED", "FAILED"];

// Luồng chuyển trạng thái hợp lệ của vận đơn
const SHIPMENT_TRANSITIONS = {
  PENDING_PICKUP: ["IN_TRANSIT", "DELIVERED", "FAILED"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: [],
};

const generateShipmentCode = () => {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `VD-${datePart}-${rand}`;
};

// Các trạng thái đơn hàng được phép đồng bộ khi vận đơn chuyển
const SYNC_ORDER_STATUS = {
  IN_TRANSIT: { orderStatus: "SHIPPING", from: ["PENDING", "CONFIRMED"] },
  DELIVERED: { orderStatus: "COMPLETED", from: ["PENDING", "CONFIRMED", "SHIPPING"] },
};

export const shipmentService = {
  async list({ page, limit, search, status, partnerId, orderId, from, to }) {
    const where = {};
    if (status) where.status = status;
    if (partnerId) where.partnerId = Number(partnerId);
    if (orderId) where.orderId = Number(orderId);
    if (search) {
      where.OR = [
        { shipmentCode: { contains: search, mode: "insensitive" } },
        { trackingCode: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
        { recipientPhone: { contains: search } },
        { order: { orderCode: { contains: search, mode: "insensitive" } } },
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
      shipmentRepository.findMany({ where, skip, limit }),
      shipmentRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    const shipment = await shipmentRepository.findById(Number(id));
    if (!shipment) throw new ApiError(404, "Không tìm thấy vận đơn");
    return shipment;
  },

  async create({ orderId, partnerId, trackingCode, recipientName, recipientPhone, recipientAddress, shippingFee = 0, note }) {
    const orderIdNum = Number(orderId);
    if (!orderIdNum) throw new ApiError(400, "Đơn hàng không hợp lệ");

    const order = await orderRepository.findById(orderIdNum);
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");
    if (order.status === "CANCELLED") {
      throw new ApiError(400, "Không thể tạo vận đơn cho đơn hàng đã hủy");
    }
    if (order.status === "COMPLETED") {
      throw new ApiError(400, "Không thể tạo vận đơn cho đơn hàng đã hoàn thành");
    }

    const existing = await shipmentRepository.findActiveByOrderId(orderIdNum);
    if (existing) {
      throw new ApiError(
        400,
        `Đơn hàng ${order.orderCode} đã có vận đơn ${existing.shipmentCode} (chưa kết thúc)`
      );
    }

    const partner = await deliveryPartnerRepository.findById(Number(partnerId));
    if (!partner) throw new ApiError(404, "Không tìm thấy đối tác giao hàng");
    if (!partner.isActive) throw new ApiError(400, "Đối tác giao hàng đang bị tắt hoạt động");

    const shipmentCode = generateShipmentCode();
    const fees = Number(shippingFee);
    if (Number.isNaN(fees) || fees < 0) throw new ApiError(400, "Phí vận chuyển không hợp lệ");

    return shipmentRepository.create({
      shipmentCode,
      orderId: orderIdNum,
      partnerId: partner.id,
      trackingCode: trackingCode?.trim() || null,
      recipientName: recipientName?.trim() || order.customer?.fullName || "",
      recipientPhone: recipientPhone?.trim() || order.customer?.phone || "",
      recipientAddress: recipientAddress?.trim() || order.customer?.address || "",
      shippingFee: fees,
      note: note?.trim() || null,
    });
  },

  async update(id, data) {
    const shipment = await shipmentRepository.findById(Number(id));
    if (!shipment) throw new ApiError(404, "Không tìm thấy vận đơn");
    if (["DELIVERED", "FAILED"].includes(shipment.status)) {
      throw new ApiError(400, "Không thể chỉnh sửa vận đơn đã kết thúc");
    }

    const payload = {};
    if (data.trackingCode !== undefined) payload.trackingCode = data.trackingCode?.trim() || null;
    if (data.recipientName !== undefined) payload.recipientName = (data.recipientName || "").trim();
    if (data.recipientPhone !== undefined) payload.recipientPhone = (data.recipientPhone || "").trim();
    if (data.recipientAddress !== undefined) payload.recipientAddress = (data.recipientAddress || "").trim();
    if (data.note !== undefined) payload.note = data.note?.trim() || null;
    if (data.shippingFee !== undefined) {
      const fees = Number(data.shippingFee);
      if (Number.isNaN(fees) || fees < 0) throw new ApiError(400, "Phí vận chuyển không hợp lệ");
      payload.shippingFee = fees;
    }
    if (data.partnerId !== undefined) {
      const partner = await deliveryPartnerRepository.findById(Number(data.partnerId));
      if (!partner) throw new ApiError(404, "Không tìm thấy đối tác giao hàng");
      if (!partner.isActive) throw new ApiError(400, "Đối tác giao hàng đang bị tắt hoạt động");
      payload.partnerId = partner.id;
    }

    return shipmentRepository.update(shipment.id, payload);
  },

  async updateStatus(id, status) {
    const shipment = await shipmentRepository.findById(Number(id));
    if (!shipment) throw new ApiError(404, "Không tìm thấy vận đơn");

    if (!SHIPMENT_STATUSES.includes(status)) {
      throw new ApiError(400, "Trạng thái vận đơn không hợp lệ");
    }

    if (shipment.status !== status) {
      const allowed = SHIPMENT_TRANSITIONS[shipment.status] || [];
      if (!allowed.includes(status)) {
        throw new ApiError(
          400,
          `Không thể chuyển trạng thái vận đơn từ ${shipment.status} sang ${status}`
        );
      }
    }

    const sync = SYNC_ORDER_STATUS[status];
    const shouldSyncOrder = sync && !["DELIVERED", "FAILED"].includes(shipment.status) &&
      sync.from.includes(shipment.order?.status);

    return shipmentRepository.transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status,
          deliveredAt: status === "DELIVERED" ? new Date() : null,
        },
        include: {
          order: {
            include: {
              customer: { select: { id: true, fullName: true, phone: true, address: true } },
              user: { select: { id: true, username: true, fullName: true } },
            },
          },
          partner: true,
        },
      });

      if (shouldSyncOrder && shipment.order?.id) {
        await tx.order.update({
          where: { id: shipment.order.id },
          data: { status: sync.orderStatus },
        });
      }

      return updated;
    });
  },
};
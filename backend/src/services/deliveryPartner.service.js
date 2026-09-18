import { deliveryPartnerRepository } from "../repositories/deliveryPartner.repository.js";
import { shipmentRepository } from "../repositories/shipment.repository.js";
import { ApiError } from "../utils/ApiError.js";

const normalizeCode = (code) => (code || "").trim().toUpperCase();

export const deliveryPartnerService = {
  async listAll({ isActive } = {}) {
    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
    return deliveryPartnerRepository.findAll(where);
  },

  async list({ page, limit, search, isActive }) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      deliveryPartnerRepository.findMany({ where, skip, limit }),
      deliveryPartnerRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    const partner = await deliveryPartnerRepository.findById(Number(id));
    if (!partner) throw new ApiError(404, "Không tìm thấy đối tác giao hàng");
    return partner;
  },

  async create(data) {
    const code = normalizeCode(data.code);
    const name = (data.name || "").trim();
    if (!code) throw new ApiError(400, "Mã đối tác không được trống");
    const exist = await deliveryPartnerRepository.findByCodeOrName(code, name);
    if (exist) {
      throw new ApiError(400, "Mã hoặc tên đối tác giao hàng đã tồn tại");
    }
    return deliveryPartnerRepository.create({ ...data, code, name });
  },

  async update(id, data) {
    const partner = await deliveryPartnerRepository.findById(Number(id));
    if (!partner) throw new ApiError(404, "Không tìm thấy đối tác giao hàng");

    const payload = { ...data };
    if (payload.code !== undefined) payload.code = normalizeCode(payload.code);
    if (payload.name !== undefined) payload.name = (payload.name || "").trim();

    if (payload.code || payload.name) {
      const exist = await deliveryPartnerRepository.findByCodeOrName(
        payload.code || partner.code,
        payload.name || partner.name
      );
      if (exist && exist.id !== partner.id) {
        throw new ApiError(400, "Mã hoặc tên đối tác giao hàng đã tồn tại");
      }
    }

    return deliveryPartnerRepository.update(id, payload);
  },

  async remove(id) {
    const partner = await deliveryPartnerRepository.findById(Number(id));
    if (!partner) throw new ApiError(404, "Không tìm thấy đối tác giao hàng");
    const count = await shipmentRepository.count({ partnerId: partner.id });
    if (count > 0) {
      throw new ApiError(
        400,
        "Không thể xóa đối tác đang có vận đơn — hãy tắt hoạt động (isActive = false)"
      );
    }
    return deliveryPartnerRepository.remove(id);
  },
};
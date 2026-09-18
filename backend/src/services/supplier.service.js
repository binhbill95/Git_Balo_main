import { supplierRepository } from "../repositories/supplier.repository.js";
import { purchaseOrderRepository } from "../repositories/purchaseOrder.repository.js";
import { ApiError } from "../utils/ApiError.js";

export const supplierService = {
  async list({ page, limit, search, isActive }) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === "true" || isActive === true;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      supplierRepository.findMany({ where, skip, limit }),
      supplierRepository.count(where),
    ]);
    return { items, total };
  },

  async getAll() {
    return supplierRepository.findAll({ isActive: true });
  },

  async getById(id) {
    const supplier = await supplierRepository.findById(Number(id));
    if (!supplier) throw new ApiError(404, "Không tìm thấy nhà cung cấp");
    return supplier;
  },

  async create(data) {
    const code = data.code?.trim() || "";
    const name = data.name?.trim() || "";
    if (!code) throw new ApiError(400, "Mã nhà cung cấp không được trống");
    if (!name) throw new ApiError(400, "Tên nhà cung cấp không được trống");

    const existing = await supplierRepository.findByCodeOrName(code, name);
    if (existing) {
      throw new ApiError(
        400,
        `Mã hoặc tên nhà cung cấp "${existing.code === code ? code : name}" đã tồn tại`
      );
    }

    return supplierRepository.create({
      code,
      name,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      taxCode: data.taxCode?.trim() || null,
      note: data.note?.trim() || null,
      isActive: data.isActive ?? true,
    });
  },

  async update(id, data) {
    const supplier = await supplierRepository.findById(Number(id));
    if (!supplier) throw new ApiError(404, "Không tìm thấy nhà cung cấp");

    const payload = {};
    if (data.code !== undefined) {
      const code = data.code.trim();
      const dup = await supplierRepository.findByCodeOrName(code, supplier.name);
      if (dup && dup.id !== supplier.id) {
        throw new ApiError(400, `Mã nhà cung cấp "${code}" đã tồn tại`);
      }
      payload.code = code;
    }
    if (data.name !== undefined) {
      const name = data.name.trim();
      const dup = await supplierRepository.findByCodeOrName(supplier.code, name);
      if (dup && dup.id !== supplier.id) {
        throw new ApiError(400, `Tên nhà cung cấp "${name}" đã tồn tại`);
      }
      payload.name = name;
    }
    if (data.phone !== undefined) payload.phone = data.phone?.trim() || null;
    if (data.email !== undefined) payload.email = data.email?.trim() || null;
    if (data.address !== undefined) payload.address = data.address?.trim() || null;
    if (data.taxCode !== undefined) payload.taxCode = data.taxCode?.trim() || null;
    if (data.note !== undefined) payload.note = data.note?.trim() || null;
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    return supplierRepository.update(supplier.id, payload);
  },

  async remove(id) {
    const supplier = await supplierRepository.findById(Number(id));
    if (!supplier) throw new ApiError(404, "Không tìm thấy nhà cung cấp");
    const count = await purchaseOrderRepository.count({ supplierId: Number(id) });
    if (count > 0) {
      throw new ApiError(400, "Không thể xóa nhà cung cấp đã phát sinh đơn nhập hàng");
    }
    return supplierRepository.remove(Number(id));
  },
};
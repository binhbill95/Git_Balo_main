import { customerRepository } from "../repositories/customer.repository.js";
import { ApiError } from "../utils/ApiError.js";

export const customerService = {
  async list({ page, limit, search }) {
    const where = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      customerRepository.findMany({ where, skip, limit }),
      customerRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    const customer = await customerRepository.findById(Number(id));
    if (!customer) throw new ApiError(404, "Không tìm thấy khách hàng");
    return customer;
  },

  async create(data) {
    const existing = await customerRepository.findByPhone(data.phone);
    if (existing) throw new ApiError(400, "Số điện thoại đã tồn tại");
    return customerRepository.create(data);
  },

  async update(id, data) {
    const customer = await customerRepository.findById(Number(id));
    if (!customer) throw new ApiError(404, "Không tìm thấy khách hàng");
    if (data.phone) {
      const dup = await customerRepository.findByPhone(data.phone);
      if (dup && dup.id !== Number(id)) {
        throw new ApiError(400, "Số điện thoại đã tồn tại");
      }
    }
    return customerRepository.update(Number(id), data);
  },

  async remove(id) {
    const customer = await customerRepository.findById(Number(id));
    if (!customer) throw new ApiError(404, "Không tìm thấy khách hàng");
    return customerRepository.remove(Number(id));
  },
};
import { categoryRepository } from "../repositories/category.repository.js";
import { productRepository } from "../repositories/product.repository.js";

export const categoryService = {
  async listAll() {
    return categoryRepository.findMany({ where: {}, limit: 100, orderBy: { name: "asc" } });
  },

  async list({ page, limit, search, isActive }) {
    const where = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      categoryRepository.findMany({ where, skip, limit }),
      categoryRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    return categoryRepository.findById(id);
  },

  async create(data) {
    return categoryRepository.create(data);
  },

  async update(id, data) {
    return categoryRepository.update(id, data);
  },

  async remove(id) {
    const count = await productRepository.count({ categoryId: id });
    if (count > 0) {
      const err = new Error("Không thể xóa danh mục đang chứa sản phẩm");
      err.statusCode = 400;
      throw err;
    }
    return categoryRepository.remove(id);
  },
};
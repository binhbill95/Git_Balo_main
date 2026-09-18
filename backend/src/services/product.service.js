import { productRepository } from "../repositories/product.repository.js";
import { stockLogRepository } from "../repositories/stockLog.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { toSlug } from "../utils/slugify.js";

const normalizeBarcode = (value) => (value == null ? "" : String(value).trim());

export const productService = {
  async list({ page, limit, search, categoryId, minStock, isActive }) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = Number(categoryId);
    if (minStock !== undefined) where.stock = { lte: Number(minStock) };
    if (isActive !== undefined) {
      where.isActive = isActive;
      if (isActive) where.category = { isActive: true };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      productRepository.findMany({ where, skip, limit }),
      productRepository.count(where),
    ]);
    return { items, total };
  },

  async getById(id) {
    const product = await productRepository.findById(Number(id));
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm");
    return product;
  },

  async getByBarcode(barcode) {
    const code = normalizeBarcode(barcode);
    if (!code) throw new ApiError(400, "Mã vạch không được trống");
    const product = await productRepository.findByBarcode(code);
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm với mã vạch này");
    return product;
  },

  async create(data) {
    const existing = await productRepository.findBySku(data.sku);
    if (existing) throw new ApiError(400, `SKU "${data.sku}" đã tồn tại`);

    const barcode = normalizeBarcode(data.barcode);
    if (barcode) {
      const dup = await productRepository.findByBarcode(barcode);
      if (dup) throw new ApiError(400, `Mã vạch "${barcode}" đã tồn tại`);
    }

    const created = await productRepository.create({
      ...data,
      barcode: barcode || null,
      slug: toSlug(data.name) + "-" + Date.now().toString(36),
    });

    return created;
  },

  async update(id, data) {
    const product = await productRepository.findById(Number(id));
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm");

    const payload = { ...data };
    if (payload.barcode !== undefined) {
      const barcode = normalizeBarcode(payload.barcode);
      payload.barcode = barcode || null;
      if (barcode) {
        const dup = await productRepository.findByBarcode(barcode);
        if (dup && dup.id !== product.id) {
          throw new ApiError(400, `Mã vạch "${barcode}" đã tồn tại`);
        }
      }
    }

    return productRepository.update(Number(id), payload);
  },

  async remove(id) {
    const product = await productRepository.findById(Number(id));
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm");
    const inOrders = await productRepository.transaction(async (tx) => {
      const count = await tx.orderItem.count({ where: { productId: Number(id) } });
      return count;
    });
    if (inOrders > 0) {
      throw new ApiError(400, "Không thể xóa sản phẩm đã xuất hiện trong đơn hàng");
    }
    return productRepository.remove(Number(id));
  },

  async adjustStock({ productId, newStock, userId, note }) {
    const id = Number(productId);
    const product = await productRepository.findById(id);
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm");

    const before = product.stock;
    if (newStock < 0) throw new ApiError(400, "Tồn kho không được âm");

    await productRepository.transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { stock: newStock } });
      await tx.stockLog.create({
        data: {
          productId: id,
          userId,
          type: newStock >= before ? "IMPORT" : "EXPORT",
          quantity: Math.abs(newStock - before),
          before,
          after: newStock,
          note: note || "Điều chỉnh tồn kho",
        },
      });
    });

    return productRepository.findById(id);
  },

  async getStockLogs({ page, limit, productId, userId }) {
    const where = {};
    if (productId) where.productId = Number(productId);
    if (userId) where.userId = Number(userId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      stockLogRepository.findMany({ where, skip, limit }),
      stockLogRepository.count(where),
    ]);
    return { items, total };
  },

  async importMany(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "Danh sách sản phẩm không được trống");
    }

    const [categories, existingProducts] = await Promise.all([
      categoryRepository.findMany({ where: {}, limit: 1000 }),
      productRepository.findAll(),
    ]);

    const categoryMap = new Map(
      categories.map((c) => [c.name.trim().toLowerCase(), c.id])
    );
    const seenSku = new Set(existingProducts.map((p) => p.sku.trim().toLowerCase()));
    const seenBarcode = new Set(
      existingProducts.filter((p) => p.barcode).map((p) => p.barcode.trim())
    );
    const result = { imported: 0, failed: 0, errors: [] };

    for (let i = 0; i < items.length; i++) {
      const raw = items[i] || {};
      const row = i + 2;
      try {
        const name = String(raw.name ?? "").trim();
        const sku = String(raw.sku ?? "").trim();
        if (!name) throw new Error("Thiếu tên sản phẩm");
        if (!sku) throw new Error("Thiếu SKU");

        const skuKey = sku.toLowerCase();
        if (seenSku.has(skuKey)) throw new Error(`SKU "${sku}" đã tồn tại`);

        const categoryId = categoryMap.get(String(raw.category ?? "").trim().toLowerCase());
        if (!categoryId) throw new Error(`Danh mục "${raw.category}" không tồn tại`);

        const price = Number(raw.price);
        if (!Number.isFinite(price) || price <= 0) throw new Error("Giá bán không hợp lệ");

        const costPrice =
          raw.costPrice === "" ||
          raw.costPrice === undefined ||
          raw.costPrice === null
            ? null
            : Number(raw.costPrice);
        if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) {
          throw new Error("Giá vốn không hợp lệ");
        }

        const stock = Number(raw.stock ?? 0);
        if (!Number.isInteger(stock) || stock < 0) throw new Error("Tồn kho không hợp lệ");

        const barcode = normalizeBarcode(raw.barcode);
        if (barcode && seenBarcode.has(barcode)) {
          throw new Error(`Mã vạch "${barcode}" đã tồn tại`);
        }

        const created = await productRepository.create({
          name,
          sku,
          slug: toSlug(name) + "-" + Date.now().toString(36) + i,
          description: raw.description ? String(raw.description) : null,
          price,
          costPrice,
          stock,
          barcode: barcode || null,
          color: raw.color ? String(raw.color) : null,
          categoryId,
          isActive: raw.isActive === false || raw.isActive === "Ẩn" ? false : true,
        });

        if (barcode) {
          seenBarcode.add(barcode);
        }

        seenSku.add(skuKey);
        result.imported += 1;
      } catch (err) {
        result.failed += 1;
        result.errors.push({ row, message: err.message });
      }
    }

    return result;
  },
};
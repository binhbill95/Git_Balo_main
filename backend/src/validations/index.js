import { z } from "zod";

export const authSchemas = {
  login: {
    body: z.object({
      username: z.string().min(1, "Tên đăng nhập không được trống"),
      password: z.string().min(1, "Mật khẩu không được trống"),
    }),
  },
  refresh: {
    body: z.object({
      refreshToken: z.string().min(1, "Thiếu refresh token"),
    }),
  },
  changePassword: {
    body: z.object({
      oldPassword: z.string().min(1, "Mật khẩu cũ không được trống"),
      newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    }),
  },
};

export const categorySchemas = {
  create: {
    body: z.object({
      name: z.string().min(1, "Tên danh mục không được trống"),
      slug: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  },
  update: {
    body: z.object({
      name: z.string().min(1, "Tên danh mục không được trống").optional(),
      slug: z.string().optional(),
      description: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  },
};

export const productSchemas = {
  create: {
    body: z.object({
      name: z.string().min(1, "Tên sản phẩm không được trống"),
      sku: z.string().min(1, "SKU không được trống"),
      barcode: z.string().optional().nullable(),
      description: z.string().optional(),
      price: z.number().positive("Giá phải là số dương"),
      costPrice: z.number().nonnegative().optional(),
      stock: z.number().int().nonnegative().optional(),
      imageUrl: z.string().optional(),
      color: z.string().optional(),
      categoryId: z.number().int().positive("Danh mục không hợp lệ"),
      isActive: z.boolean().optional(),
    }),
  },
  update: {
    body: z.object({
      name: z.string().min(1).optional(),
      sku: z.string().min(1).optional(),
      barcode: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      price: z.number().positive().optional(),
      costPrice: z.number().nonnegative().nullable().optional(),
      stock: z.number().int().nonnegative().optional(),
      imageUrl: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
      categoryId: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    }),
  },
  adjustStock: {
    body: z.object({
      newStock: z.number().int().nonnegative("Tồn kho không được âm"),
      note: z.string().optional(),
    }),
  },
  importMany: {
    body: z.object({
      items: z.array(z.any()).min(1, "Danh sách sản phẩm không được trống"),
    }),
  },
};

export const appSettingSchemas = {
  update: {
    body: z.object({
      settings: z
        .object({
          support_hotline: z.string().nullable().optional(),
          support_zalo: z.string().nullable().optional(),
          support_email: z.string().nullable().optional(),
        })
        .strict()
        .optional(),
    }),
  },
};

export const customerSchemas = {
  create: {
    body: z.object({
      fullName: z.string().min(1, "Tên khách hàng không được trống"),
      phone: z.string().min(9, "Số điện thoại không hợp lệ"),
      email: z.string().email("Email không hợp lệ").optional().nullable(),
      address: z.string().optional().nullable(),
      gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
    }),
  },
  update: {
    body: z.object({
      fullName: z.string().min(1).optional(),
      phone: z.string().min(9).optional(),
      email: z.string().email("Email không hợp lệ").optional().nullable(),
      address: z.string().optional().nullable(),
      gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
    }),
  },
};

export const orderSchemas = {
  create: {
    body: z.object({
      customerId: z
        .number()
        .int()
        .positive("Khách hàng không hợp lệ")
        .optional()
        .nullable(),
      note: z.string().optional(),
      paymentMethod: z
        .enum(["CASH", "TRANSFER", "CARD"], { error: "Phương thức thanh toán không hợp lệ" })
        .default("CASH"),
      items: z
        .array(
          z.object({
            productId: z.number().int().positive("Sản phẩm không hợp lệ"),
            quantity: z.number().int().positive("Số lượng phải > 0"),
          })
        )
        .min(1, "Đơn hàng cần ít nhất 1 sản phẩm"),
    }),
  },
  updateStatus: {
    body: z.object({
      status: z.enum(["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]),
    }),
  },
};

export const deliveryPartnerSchemas = {
  create: {
    body: z.object({
      code: z.string().min(1, "Mã đối tác không được trống"),
      name: z.string().min(1, "Tên đối tác không được trống"),
      phone: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  },
  update: {
    body: z.object({
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  },
};

export const shipmentSchemas = {
  create: {
    body: z.object({
      orderId: z.number().int().positive("Đơn hàng không hợp lệ"),
      partnerId: z.number().int().positive("Đối tác giao hàng không hợp lệ"),
      trackingCode: z.string().optional().nullable(),
      recipientName: z.string().optional().nullable(),
      recipientPhone: z.string().optional().nullable(),
      recipientAddress: z.string().optional().nullable(),
      shippingFee: z.number().nonnegative("Phí vận chuyển không được âm").optional(),
      note: z.string().optional().nullable(),
    }),
  },
  update: {
    body: z.object({
      partnerId: z.number().int().positive().optional(),
      trackingCode: z.string().nullable().optional(),
      recipientName: z.string().min(1).optional(),
      recipientPhone: z.string().optional(),
      recipientAddress: z.string().optional(),
      shippingFee: z.number().nonnegative().optional(),
      note: z.string().nullable().optional(),
    }),
  },
  updateStatus: {
    body: z.object({
      status: z.enum(["PENDING_PICKUP", "IN_TRANSIT", "DELIVERED", "FAILED"]),
    }),
  },
};

export const supplierSchemas = {
  create: {
    body: z.object({
      code: z.string().min(1, "Mã nhà cung cấp không được trống"),
      name: z.string().min(1, "Tên nhà cung cấp không được trống"),
      phone: z.string().optional().nullable(),
      email: z.string().email("Email không hợp lệ").optional().nullable(),
      address: z.string().optional().nullable(),
      taxCode: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  },
  update: {
    body: z.object({
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      email: z.string().email("Email không hợp lệ").nullable().optional(),
      address: z.string().nullable().optional(),
      taxCode: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  },
};

export const purchaseOrderSchemas = {
  create: {
    body: z.object({
      supplierId: z.number().int().positive("Nhà cung cấp không hợp lệ"),
      note: z.string().optional().nullable(),
      items: z
        .array(
          z.object({
            productId: z.number().int().positive("Sản phẩm không hợp lệ"),
            quantity: z.number().int().positive("Số lượng phải > 0"),
            unitPrice: z.number().nonnegative("Giá nhập không được âm"),
          })
        )
        .min(1, "Đơn nhập cần ít nhất 1 sản phẩm"),
    }),
  },
  updateStatus: {
    body: z.object({
      status: z.enum(["PENDING", "APPROVED", "RECEIVED", "CANCELLED"]),
    }),
  },
};

export const userSchemas = {
  create: {
    body: z.object({
      username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
      email: z.string().email("Email không hợp lệ"),
      password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
      fullName: z.string().min(1, "Họ tên không được trống"),
      role: z.enum(["ADMIN", "SALES", "WAREHOUSE", "MANAGER"]),
    }),
  },
  update: {
    body: z.object({
      fullName: z.string().min(1).optional(),
      email: z.string().email("Email không hợp lệ").optional(),
      password: z.string().min(6).optional(),
      role: z.enum(["ADMIN", "SALES", "WAREHOUSE", "MANAGER"]).optional(),
      isActive: z.boolean().optional(),
    }),
  },
};

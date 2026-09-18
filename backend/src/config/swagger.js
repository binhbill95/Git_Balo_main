import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Balo - Túi xách Store API",
      version: "1.0.0",
      description:
        "API cho ứng dụng quản lý và bán hàng Balo - Túi xách.\nĐăng nhập bằng tài khoản demo, copy access token vào nút **Authorize**.",
    },
    servers: [{ url: "http://localhost:3000/api/v1", description: "Development server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string" },
            password: { type: "string" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    username: { type: "string" },
                    email: { type: "string" },
                    fullName: { type: "string" },
                    role: { type: "string" },
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            sku: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            stock: { type: "integer" },
            slug: { type: "string" },
            imageUrl: { type: "string" },
            categoryId: { type: "integer" },
            isActive: { type: "boolean" },
          },
        },
        Customer: {
          type: "object",
          properties: {
            id: { type: "integer" },
            fullName: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            address: { type: "string" },
            gender: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
        OrderItemInput: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "integer" },
            quantity: { type: "integer" },
          },
        },
        CreateOrderRequest: {
          type: "object",
          required: ["customerId", "items"],
          properties: {
            customerId: { type: "integer" },
            note: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItemInput" } },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "integer" },
            orderCode: { type: "string" },
            customerId: { type: "integer" },
            userId: { type: "integer" },
            status: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"],
            },
            totalAmount: { type: "number" },
            note: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
};

export default swaggerJsdoc(options);
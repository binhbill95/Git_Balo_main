# ERD - Sơ đồ cơ sở dữ liệu

Dự án có **8 bảng**: `roles`, `users`, `categories`, `products`, `customers`, `orders`, `order_items`, `inventory_logs`.

## Sơ đồ quan hệ (Mermaid)

```mermaid
erDiagram
    ROLES ||--o{ USERS : "có"
    CATEGORIES ||--o{ PRODUCTS : "phân loại"
    CUSTOMERS ||--o{ ORDERS : "đặt"
    USERS ||--o{ ORDERS : "tạo đơn"
    USERS ||--o{ INVENTORY_LOGS : "ghi log"
    PRODUCTS ||--o{ ORDER_ITEMS : "dòng đơn"
    ORDERS ||--o{ ORDER_ITEMS : "chứa"
    PRODUCTS ||--o{ INVENTORY_LOGS : "theo dõi"

    ROLES {
        int id PK
        enum name "ADMIN/SALES/WAREHOUSE/MANAGER"
        text description
    }
    USERS {
        int id PK
        varchar username UK
        varchar email UK
        text password "BCrypt hash"
        varchar fullName
        int roleId FK
        boolean isActive
        text refreshToken
    }
    CATEGORIES {
        int id PK
        varchar name UK
        varchar slug UK
        text description
        boolean isActive
    }
    PRODUCTS {
        int id PK
        varchar sku UK
        varchar name
        decimal price
        decimal costPrice
        int stock
        int categoryId FK
        boolean isActive
    }
    CUSTOMERS {
        int id PK
        varchar fullName
        varchar phone UK
        varchar email
        text address
        varchar gender
    }
    ORDERS {
        int id PK
        varchar orderCode UK
        int customerId FK
        int userId FK
        enum status "PENDING/CONFIRMED/SHIPPING/COMPLETED/CANCELLED"
        decimal totalAmount
        text note
    }
    ORDER_ITEMS {
        int id PK
        int orderId FK
        int productId FK
        int quantity
        decimal price
    }
    INVENTORY_LOGS {
        int id PK
        int productId FK
        int userId FK
        enum type "IMPORT/EXPORT/ADJUST/CANCEL"
        int quantity
        int before
        int after
        text note
    }
```

## Bảng tóm tắt

| Bảng | Khóa chính | Khóa ngoại | Ràng buộc / Index chính |
|---|---|---|---|
| `roles` | `id` | — | `name` UNIQUE |
| `users` | `id` | `roleId → roles.id` | `username`/`email` UNIQUE; index `roleId`, `email` |
| `categories` | `id` | — | `name`/`slug` UNIQUE; index `isActive` |
| `products` | `id` | `categoryId → categories.id` | `sku`/`slug` UNIQUE; index `categoryId`, `name`, `isActive` |
| `customers` | `id` | — | `phone` UNIQUE; index `fullName`, `phone` |
| `orders` | `id` | `customerId → customers.id`, `userId → users.id` | `orderCode` UNIQUE; index `customerId`, `userId`, `status`, `createdAt` |
| `order_items` | `id` | `orderId → orders.id`, `productId → products.id` | UNIQUE(`orderId`,`productId`); index `productId` |
| `inventory_logs` | `id` | `productId → products.id`, `userId → users.id` | index `productId`, `userId`, `createdAt` |

## Ràng buộc toàn vẹn chính

1. **Primary Key**: mọi bảng đều có `id SERIAL PRIMARY KEY`.
2. **Foreign Key**: 
   - `ON DELETE RESTRICT` cho quan hệ cha-con (không cho xóa sản phẩm/khách hàng/danh mục đang được tham chiếu).
   - `ON DELETE CASCADE` cho `order_items` khi xóa đơn hàng.
3. **Constraints**:
   - `username`, `email`, `sku`, `slug`, `phone`, `orderCode`, `roles.name` là UNIQUE.
   - `order_items.quantity` do schema/validate code kiểm soát > 0.
   - `orders.status` là ENUM giới hạn 5 trạng thái.
   - `inventory_logs.before/after` lưu số tồn trước/sau để báo cáo.
4. **Indexes**: index trên mọi khóa ngoại + cột hay lọc/tìm kiếm (`name`, `status`, `createdAt`, `phone`...).

## Script SQL

File migration đầy đủ (tạo enum + bảng + index + foreign key):
`backend/prisma/migrations/20260915233928_init/migration.sql`
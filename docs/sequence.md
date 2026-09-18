# Sequence Diagram

Các kịch bản tiêu biểu của hệ thống.

## 1. Đăng nhập & cấp token

```mermaid
sequenceDiagram
    participant UI as Frontend (React)
    participant API as Backend (Express)
    participant DB as PostgreSQL (Prisma)

    UI->>API: POST /api/v1/auth/login {username, password}
    API->>DB: findByUsername(username) + role
    API->>API: comparePassword(BCrypt)
    alt password đúng
        API-->>UI: 200 {accessToken, refreshToken, user}
        UI->>UI: Lưu token vào localStorage
    else password sai
        API-->>UI: 401 "Sai tên đăng nhập hoặc mật khẩu"
    end
```

## 2. Tạo đơn hàng (trừ tồn kho trong transaction)

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Controller
    participant SVC as OrderService
    participant DB as Prisma Transaction

    UI->>API: POST /api/v1/orders {customerId, items[]}
    API->>API: authenticate (JWT) + authorize(SALES, ADMIN)
    API->>SVC: orderService.create(...)
    SVC->>DB: BEGIN TRANSACTION
    loop Từng sản phẩm trong items
        SVC->>DB: SELECT product (kiểm tra tồn kho)
        alt đủ hàng
            DB-->>SVC: product
            SVC->>DB: UPDATE product.stock = stock - qty
            SVC->>DB: INSERT inventory_logs (EXPORT)
        else không đủ
            DB-->>SVC: error → ROLLBACK
        end
    end
    SVC->>DB: INSERT orders (status=PENDING, totalAmount)
    SVC->>DB: INSERT order_items
    DB->>DB: COMMIT
    DB-->>SVC: order(id)
    SVC-->>API: order đầy đủ
    API-->>UI: 201 {order}
```

## 3. Hủy đơn hàng (hoàn kho)

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Express
    participant SVC as OrderService
    participant DB as Prisma Transaction

    UI->>API: PATCH /api/v1/orders/:id/status {status: CANCELLED}
    API->>API: authenticate + authorize
    API->>SVC: orderService.updateStatus(id)
    SVC->>DB: SELECT order + orderItems
    alt đơn đang PENDING
        SVC->>DB: BEGIN TRANSACTION
        loop từng orderItem
            SVC->>DB: UPDATE product.stock = stock + qty
            SVC->>DB: INSERT inventory_logs (CANCEL, note=hoàn kho)
        end
        SVC->>DB: UPDATE order.status = CANCELLED
        DB->>DB: COMMIT
    else đơn ở trạng thái khác
        SVC->>DB: UPDATE order.status = CANCELLED
    end
    DB-->>SVC: order
    SVC-->>API: order
    API-->>UI: 200 {order}
```

## 4. Xem báo cáo doanh thu

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Express
    participant SVC as ReportService
    participant DB as PostgreSQL

    UI->>API: GET /api/v1/reports/monthly-revenue?year=2026
    API->>API: authenticate + authorize(ADMIN, MANAGER)
    API->>SVC: reportService.monthlyRevenue(2026)
    SVC->>DB: groupBy orders by createdAt (year 2026, NOT CANCELLED)
    DB-->>SVC: rows {month, revenue, count}
    SVC-->>API: 12 months array
    API-->>UI: 200 {data: [{month, revenue, orders}]}
    UI->>UI: Vẽ biểu đồ cột (Ant Design Charts)
```

## 5. Điều chỉnh tồn kho (Nhân viên kho)

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Express
    participant SVC as ProductService
    participant DB as Prisma Transaction

    UI->>API: PATCH /api/v1/products/:id/stock {newStock}
    API->>API: authenticate + authorize(ADMIN, WAREHOUSE)
    API->>SVC: productService.adjustStock(...)
    SVC->>DB: SELECT product (before = stock)
    SVC->>DB: UPDATE product.stock = newStock
    SVC->>DB: INSERT inventory_logs (IMPORT/EXPORT, before, after, userId)
    DB-->>SVC: product mới
    SVC-->>API: product
    API-->>UI: 200 {product}
```

## 6. Refresh Token

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Express
    participant DB as PostgreSQL

    UI->>API: POST /api/v1/auth/refresh {refreshToken}
    API->>DB: SELECT user by token (so khớp refreshToken trong DB)
    alt token hợp lệ & không bị thu hồi
        API-->>UI: 200 {accessToken mới}
    else token hết hạn / bị thu hồi
        API-->>UI: 401 "Refresh token không hợp lệ" → buộc đăng nhập lại
    end
```
# Kiến trúc hệ thống

## Tổng quan

```
┌────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                    │
│                    React + Vite + Ant Design               │
│                        http://localhost:5173               │
└──────────────────────────┬─────────────────────────────────┘
                           │  axios  (proxy: /api → :3000)
                           ▼
┌────────────────────────────────────────────────────────────┐
│                     REST API (Express)                     │
│                        http://localhost:3000               │
│                                                             │
│  routes → controllers → services → repositories → prisma   │
│        ▲                    ▲                   ▲          │
│        │  middleware        │  business logic   │  Prisma  │
│        │  (auth, RBAC,      │  nghiệp vụ        │  Client  │
│        │   validate, error) │                   │          │
│        └────────────────────┴───────────────────┘          │
└──────────────────────────┬─────────────────────────────────┘
                           │  Prisma Client (TCP 5433)
                           ▼
┌────────────────────────────────────────────────────────────┐
│                 PostgreSQL 16 (Docker)                     │
│          balo_postgres  @ localhost:5433                    │
│                        balo_store                          │
└────────────────────────────────────────────────────────────┘
```

## Kiến trúc phân tầng Backend

Áp dụng **Layered Architecture** (kiến trúc phân lớp), chuẩn bị sẵn cho việc thay ORM / database hoặc thêm module mới mà không ảnh hưởng tầng khác.

| Tầng | Vai trò | Thư mục |
|---|---|---|
| **Routes** | Định nghĩa URL, gắn middleware & chuyển controller | `src/routes/` |
| **Controllers** | Nhận request, gọi service, trả response chuẩn | `src/controllers/` |
| **Services** | Chứa toàn bộ business logic (tính tiền, trừ kho, RBAC...) | `src/services/` |
| **Repositories** | Tập trung mọi truy vấn Prisma, isolate Database | `src/repositories/` |
| **Middleware** | Xác thực JWT, phân quyền, validate, xử lý lỗi | `src/middleware/` |
| **Utils** | Hàm dùng chung: jwt, so sánh password, pagination | `src/utils/` |

### Luồng một request

```
Request HTTP
   │
   ▼
app.js (CORS, JSON parser)
   │
   ▼
Routes (route × method)
   │
   ▼
Middleware authenticate → verify JWT → gắn req.user
   │
   ▼
Middleware authorize('ADMIN') → kiểm tra role
   │
   ▼
Controller → gọi Service
   │
   ▼
Service (business logic + kiểm tra nghiệp vụ)
   │
   ▼
Repository → Prisma Client → PostgreSQL
   │
   ▼
Response JSON { success, message, data, meta }
```

## Luồng xác thực JWT + Refresh Token

```
1. POST /auth/login  →  verify user + BCrypt → cấp accessToken (15m) + refreshToken (7d)
2. Client lưu token → mọi request kèm Authorization: Bearer <accessToken>
3. accessToken hết hạn → POST /auth/refresh với refreshToken → cấp accessToken mới
4. POST /auth/logout → xóa refreshToken khỏi DB
```

- **Security**: mật khẩu hash bằng BCrypt (10 rounds), refresh token lưu trong DB, access token không lưu server (stateless).
- **RBAC**: user mang role (ADMIN/SALES/WAREHOUSE/MANAGER), mỗi route khai báo `authorize(...roles)`.

## Tính bảo trì & mở rộng

1. **Thay đổi schema DB** → sửa `prisma/schema.prisma` → `npx prisma migrate dev` (không cần viết SQL tay).
2. **Thêm endpoint mới** → thêm 1 file `routes/*.routes.js` + controller + service + (repository, nếu cần query mới).
3. **Thêm vai trò mới** → thêm vào enum `RoleName` và khai báo quyền trong từng route.
4. **Tích hợp AI** → đã có sẵn `src/modules/ai/` với mock service; sau này chỉ cần thay body hàm bằng lời gọi model AI thật (xem `docs/ai-integration.md`).

## Chi tiết biến môi trường Backend

| Biến | Giá trị | Mô tả |
|---|---|---|
| `DATABASE_URL` | `postgresql://balo_admin:balo_secret_123@localhost:5433/balo_store` | Chuỗi kết nối PostgreSQL |
| `PORT` | `3000` | Cổng API |
| `JWT_ACCESS_SECRET` | (random) | Khóa ký access token |
| `JWT_REFRESH_SECRET` | (random) | Khóa ký refresh token |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Thời hạn access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Thời hạn refresh token |
| `CLIENT_URL` | `http://localhost:5173` | Origin frontend (CORS) |
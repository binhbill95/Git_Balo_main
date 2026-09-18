# Sơ đồ kiến trúc luồng dữ liệu — Balo - Túi xách

> Bản vẽ lại dễ hình dung. Chi tiết kỹ thuật xem `docs/architecture.md`.

---

## 1. Tổng quan — Một request đi từ đâu đến đâu

```
        NGƯỜI DÙNG (Trình duyệt)
   http://localhost:5173  ←  mở UI ở đây
                │
                ▼
   ┌───────────────────────────────┐
   │        FRONTEND (React)       │  PORT 5173
   │   Vite dev server + Ant Design│
   │                               │
   │  Pages → Services (axios)     │
   └──────────────┬────────────────┘
                  │  axios gọi tới ĐƯỜNG DẪN CÙNG GỐC: /api/v1/...
                  │  (Vite PROXY chuyển tiếp, không phải server trung gian)
                  ▼
   ┌───────────────────────────────┐
   │        BACKEND (Express)      │  PORT 3000  ← ⭐ MÁY CHỦ API ĐẶT TẠI ĐÂY
   │        API REST  /api/v1      │
   │                               │
   │  Routes → Middleware →         │
   │  Controllers → Services →     │
   │  Repositories → Prisma Client │
   └──────────────┬────────────────┘
                  │  TCP 5433 (Prisma Client)
                  ▼
   ┌───────────────────────────────┐
   │   POSTGRESQL 16 (Docker)      │  PORT 5433  (container: balo_postgres)
   │        database: balo_store   │
   └───────────────────────────────┘
```

📍 **Trả lời câu hỏi "API đặt ở đâu?":** Không có tầng trung gian.
Máy chủ API chính là **Backend** (Express, `backend/src/server.js`, port 3000).
Frontend chỉ dùng **proxy phát triển của Vite** để "né" CORS khi dev — proxy này
chạy trong chính process Vite, không phải một server API riêng biệt.

---

## 2. Bên trong Backend — Kiến trúc phân tầng (Layered)

```
        REQUEST HTTP
             │
             ▼
   ┌─────────────────┐  app.js
   │ CORS + JSON     │  • kiểm tra origin http://localhost:5173
   │ parser + static │  • parse JSON body (tối đa 10MB)
   └────────┬────────┘  • phục vụ ảnh tĩnh /uploads
            ▼
   ┌─────────────────┐  routes/index.js
   │      ROUTES     │  ghép URL + method → controller
   │ /auth /products │  gắn middleware từng route
   │ /orders /ai ... │     POST /products  → authorize("ADMIN")
   └────────┬────────┘     PATCH /:id/stock → authorize("ADMIN","WAREHOUSE")
            ▼
   ┌─────────────────┐  middleware
   │   MIDDLEWARE    │  authenticate → verify JWT → gắn req.user
   │ auth · authorize│  authorize(role) → 403 nếu sai quyền
   │ validate · error│  validate (Zod)   → 400 nếu sai dữ liệu
   └────────┬────────┘  error → trả JSON chuẩn, không lộ stack
            ▼
   ┌─────────────────┐  controllers/*.controller.js
   │   CONTROLLERS   │  đọc req → gọi service → trả response
   └────────┬────────┘  (không chứa logic nghiệp vụ)
            ▼
   ┌─────────────────┐  services/*.service.js
   │    SERVICES     │  ⭐ business logic:
   │  (nghiệp vụ)    │  • tạo đơn → kiểm tra tồn kho → trừ kho
   └────────┬────────┘  • hủy đơn → hoàn kho + ghi inventory_logs
            ▼         • tính tổng tiền, check quyền...
   ┌─────────────────┐  repositories/*.repository.js
   │  REPOSITORIES   │  tập trung MỌI truy vấn Prisma
   └────────┬────────┘  (đổi DB/ORM chỉ sửa tầng này)
            ▼
   ┌─────────────────┐  config/prisma.js
   │ PRISMA CLIENT   │  chuyển query → SQL → PostgreSQL
   └────────┬────────┘
            ▼
   BALO_STORE (8 bảng: roles, users, categories, products,
                 customers, orders, order_items, inventory_logs)
```

### Luồng một request cụ thể: "Tạo đơn hàng"

```
POST /api/v1/orders   Authorization: Bearer <JWT>
  1. authenticate  →  JWT hợp lệ?  →  gắn req.user (id, role)
  2. authorize("ADMIN","SALES")  →  role có quyền? → 403 nếu là WAREHOUSE
  3. validate (Zod) →  items >= 1? quantity > 0? → 400 nếu sai
  4. orderService.create:
        - resolve khách hàng (hoặc tạo "Khách lẻ" 0000000000)
        - mở TRANSACTION:
            · mỗi sản phẩm: đủ tồn kho? → trừ kho, ghi inventory_logs (EXPORT)
            · tính tổng tiền → tạo order + order_items
        - commit
  5. Trả về JSON: { success, message, data: order, meta }
```

---

## 3. Luồng đăng nhập & JWT (2 token)

```
┌──────────┐  POST /api/v1/auth/login  { username, password }
│  Browser │ ───────────────────────────────────────────────►  Backend
│          │                                                    │  BCrypt so mật khẩu
│          │ ◄────────── { accessToken, refreshToken, user } ───┘  khớp → cấp 2 token
│          │      lưu localStorage
│          │
│          │  mọi request sau đó → Header: Authorization: Bearer <accessToken>
│          │
│          │  accessToken hết hạn (15 phút)
│          │ ────────── POST /auth/refresh { refreshToken } ──►  Backend
│          │ ◄────────────── { accessToken mới } ───────────────┘  (đổi chiếu refreshToken
│          │                                                    trong DB → cấp token mới)
```

| Token | Thời hạn | Lưu ở đâu | Mục đích |
|---|---|---|---|
| accessToken | 15 phút | localStorage (SPA) | Xác thực mọi API request |
| refreshToken | 7 ngày | localStorage + DB `users.refreshToken` | Xin accessToken mới khi hết hạn |

---

## 4. Bản đồ các thành phần — cổng & vị trí

| Thành phần | URL / Cổng | Vị trí | Ghi chú |
|---|---|---|---|
| Frontend UI | `http://localhost:5173` | `frontend/` | Vite dev server |
| Vite proxy | `/api` , `/uploads` → `:3000` | `frontend/vite.config.js` | Chỉ tồn tại khi dev |
| **Backend API** | `http://localhost:3000` | `backend/` | ⭐ Máy chủ API thực sự |
| Swagger API docs | `http://localhost:3000/api/docs` | `backend/src/config/swagger.js` | Tự sinh từ JSDoc |
| Ảnh upload | `http://localhost:3000/uploads/*` | `backend/public/uploads/` | Multer, tối đa 5MB |
| AI (mock) | `http://localhost:3000/api/v1/ai/*` | `backend/src/modules/ai/` | Placeholder, chưa gọi model thật |
| PostgreSQL | `localhost:5433` | Docker `balo_postgres` | DB `balo_store` |

---

## 5. Quyền truy cập API theo vai trò (RBAC)

```
                 ĐỌC (GET)        TẠO  (POST/PUT)         ĐIỀU CHỈNH KHÁC
Categories    mọi role          ADMIN                   ADMIN
Products      mọi role          ADMIN  (sửa/xóa)        ADMIN + WAREHOUSE (tồn kho)
Orders        mọi role          ADMIN + SALES           ADMIN + SALES + WAREHOUSE (trạng thái)
Customers     mọi role          ADMIN + SALES
Users         ADMIN             ADMIN
Reports       mọi role (ADMIN)  —
AI            mọi role          —
Uploads       —                 ADMIN
```

> Chi tiết từng route: `backend/src/routes/*.routes.js`
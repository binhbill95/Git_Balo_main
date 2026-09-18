# 📐 BÁO CÁO KIẾN TRÚC HOÀN THÀNH — Balo - Túi xách

> Tài liệu ghi nhận **kiến trúc 3 tầng của đồ án đã hoàn thành** và được kiểm tra xác nhận, dùng cho báo cáo giảng viên.
> Ngày kiểm tra: **2026-09-17**

---

## 1. Tuyên bố kiến trúc

✅ **Client (Frontend) KHÔNG truy cập trực tiếp vào Database.**

Mọi thao tác dữ liệu của người dùng đều được thực hiện **thông qua API server** (Express + Prisma). Không có kết nối trực tiếp giữa trình duyệt/Client với PostgreSQL ở bất kỳ lớp nào.

```
┌────────────┐    HTTP/JSON (JWT)    ┌──────────────┐    Prisma ORM    ┌──────────────┐
│  CLIENT    │ ────────────────────► │  API SERVER  │ ───────────────► │  DATABASE    │
│ React/Vite │ ◄──────────────────── │ Express      │ ◄─────────────── │  PostgreSQL  │
└────────────┘   JSON response       └──────────────┘    (query an toàn) └──────────────┘
       │                                   │
       │           KHÔNG có kết nối trực tiếp DB
       └──────────────────────────────────────────┘
```

---

## 2. Bằng chứng xác nhận

| Hạng mục kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Frontend gọi trực tiếp DB? | ❌ Không | `frontend/src/services/*` chỉ dùng axios gọi `/api/v1`; **không** có `PrismaClient`, `pg`, connection string, hay SQL trong toàn bộ `frontend/src` và `frontend/dist` |
| Frontend có thư viện DB? | ❌ Không | `frontend/package.json` chỉ gồm `axios`, `antd`, `react`, `recharts`, `xlsx`... |
| Backend có route cho client chạy SQL? | ❌ Không | `backend/src/routes/*` chỉ expose REST API nghiệp vụ; raw SQL duy nhất là `SELECT 1` hardcode cho health check (`system.controller.js`) |
| Mọi thao tác đi qua API? | ✅ Đúng | Chỉ duy nhất file `backend/src/app.js:31` mount API tại `/api/v1` |

### Kiến trúc xác thực trên luồng dữ liệu

Cấu trúc phân tầng hoàn chỉnh — **Controller → Service → Repository → Prisma → PostgreSQL**:

```
HTTP Request (JWT Bearer)
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware: authenticate (xác thực JWT)                    │
│              authorize (phân quyền RBAC theo role)          │
│              validate (kiểm tra input bằng Zod)             │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─ Routes (định tuyến theo nghiệp vụ) ────────────────────────┐
│  /auth  /products  /categories  /customers  /orders         │
│  /users /reports /uploads /system /ai                       │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─ Controller (xử lý request, trả response) ──────────────────┐
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─ Service (logic nghiệp vụ: trừ kho, tính tiền, hoàn kho...) ┘
      │
      ▼
┌─ Repository (tầng truy cập dữ liệu, chỉ nơi duy nhất nối DB) ┘
      │
      ▼
┌─ Prisma ORM (truy vấn tham số hóa, chống SQL injection) ────┘
      │
      ▼
   PostgreSQL 16 (Docker, cổng 5433)
```

**Điểm mấu chốt:**
- Tầng **Repository là nơi DUY NHẤT** giao tiếp với database, nằm hoàn toàn trong backend.
- Client chỉ nhận được kết quả **JSON** qua HTTP — không bao giờ nhận kết nối DB hay SQL.
- Với CORS, nếu client cố gọi thẳng cổng DB (5433) thì giao thức Postgres không thể chạy trong trình duyệt → không có đường tấn công thẳng tới DB.

---

## 3. Các endpoint công khai (không cần xác thực) — chỉ 3 endpoint hợp lệ

Mục đích: chứng minh không có lỗ hổng nào cho phép truy cập dữ liệu trực tiếp.

| Endpoint | Mục đích | Lộ dữ liệu? |
|---|---|---|
| `POST /api/v1/auth/login` | Đăng nhập | Không (chỉ trả JWT sau khi đúng credential) |
| `POST /api/v1/auth/refresh` | Cấp lại access token | Không |
| `GET /api/v1/system/health` | Health check (`SELECT 1`) | Không |

Tất cả endpoint còn lại đều yêu cầu **JWT hợp lệ + đúng quyền role** (trả 401/403 nếu sai).

---

## 4. Minh chứng đã kiểm tra chạy thực tế (PASS)

| # | Kịch bản | Kết quả |
|---|---|---|
| 1 | Đăng nhập admin/sales/warehouse/manager (BCrypt + JWT) | ✅ PASS |
| 2 | Refresh token cấp access token mới | ✅ PASS |
| 3 | RBAC: Manager tạo danh mục → 403; Warehouse tạo đơn → 403 | ✅ PASS |
| 4 | Tạo đơn → trừ tồn kho đúng (50 → 48), tính tổng tiền đúng | ✅ PASS |
| 5 | Hủy đơn PENDING → hoàn kho (48 → 47 → 48) | ✅ PASS |
| 6 | Warehouse điều chỉnh tồn kho; ghi lịch sử inventory_logs | ✅ PASS |
| 7 | Báo cáo: dashboard, doanh thu 12 tháng, top sản phẩm | ✅ PASS |
| 8 | Frontend build thành công; proxy `/api` → backend hoạt động | ✅ PASS |
| 9 | Khởi tạo DB từ schema Prisma qua migration (2 migrations) | ✅ PASS |

> Chi tiết đầy đủ: `NOTES.md` mục 5.

---

## 5. Cấu trúc 3 tầng hoàn chỉnh

```
balo-tui-store/
├── docker-compose.yml            # Tầng Database: PostgreSQL 16 (5432 trong container, 5433 ngoài host)
│
├── backend/                      # Tầng Server (API)
│   ├── src/
│   │   ├── app.js                # Mount toàn bộ API tại /api/v1
│   │   ├── routes/               # 10 nhóm route nghiệp vụ
│   │   ├── controllers/          # Xử lý request/response
│   │   ├── services/             # Logic nghiệp vụ
│   │   ├── repositories/         # Chỉ nơi duy nhất truy cập DB (Prisma)
│   │   ├── middleware/           # authenticate + authorize + validate + error
│   │   ├── config/               # env, prisma client, swagger, upload
│   │   └── modules/ai/           # AI mock (giữ kiến trúc, sẵn sàng thay thật)
│   └── prisma/
│       ├── schema.prisma         # 8 model + 4 enum
│       └── migrations/           # 2 migrations đã áp dụng
│
└── frontend/                     # Tầng Client (UI)
    └── src/
        ├── services/             # Chỉ gọi HTTP API qua axios (baseURL /api/v1)
        ├── pages/  components/   # Giao diện, không đụng DB
        ├── contexts/  hooks/     # Auth state, hooks
        └── routes/               # Bảo vệ route theo đăng nhập
```

---

## 6. Kết luận

- ✅ Kiến trúc **Client – Server – Database** được tách biệt hoàn chỉnh.
- ✅ Client **không thể** và **không có cách nào** truy cập trực tiếp database.
- ✅ Toàn bộ dữ liệu đi qua **API server** với 3 lớp bảo vệ (JWT → RBAC → Zod validation).
- ✅ Đã kiểm tra chạy thực tế các luồng nghiệp vụ và **tất cả PASS**.

> Ghi chú vận hành (không ảnh hưởng kiến trúc):
> - Cổng DB `5433` đang mở trên host cho mục đích phát triển — khi deploy production nên giới hạn firewall.
> - File `backend/_query_orders.sql` là file dev, không được serve ra client.
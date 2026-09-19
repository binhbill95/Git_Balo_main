# Ứng dụng Quản lý & Bán hàng Balo - Túi xách

Đồ án môn học — hệ thống quản lý kho, bán hàng và báo cáo cho cửa hàng **Balo - Túi xách** bằng **Node.js/Express + React** (chuẩn hướng dẫn từng bước chạy phía dưới).

## Thành viên nhóm

| Họ tên | MSSV | Email | Vai trò |
|---|---|---|---|
| Nguyễn Đức Bình | 21810004 | 21810004@student.hcmus.edu.vn | Phát triển toàn diện (backend, frontend, database, báo cáo) |

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js + Express (ESM) |
| Database | PostgreSQL 16 (Docker, cổng **5433**) |
| ORM | Prisma |
| Frontend | React + Vite |
| UI | Ant Design |
| Auth | JWT (Access + Refresh Token) |
| Mật khẩu | BCrypt |
| Upload ảnh | Multer |
| Xuất báo cáo | xlsx (Excel) + In |
| API Documentation | Swagger (swagger-ui-express) — tự sinh từ JSDoc, truy cập `/api/docs` |

## Tính năng

- Đăng nhập/đăng xuất, phân quyền theo vai trò (Admin, Sales, Warehouse, Manager)
- Quản lý danh mục, sản phẩm (barcode, tồn kho, điều chỉnh stock), khách hàng, tài khoản
- Bán hàng POS (giảm tồn kho, QR thanh toán ngân hàng, in hóa đơn)
- Đơn hàng, vận đơn giao hàng (liên kết với đối tác GHN/GHTK/...)
- **Nhà cung cấp + Đơn nhập hàng**: quản lý NCC, đặt đơn → duyệt → nhập kho (tự cập nhật tồn kho, giá vốn, lịch sử nhập)
- Báo cáo: bán hàng, cuối ngày, tồn kho, khách hàng (xem + in + xuất Excel)
- AI mô phỏng: chat, gợi ý, phân tích, dự báo

## Kiến trúc hệ thống

Ứng dụng chạy theo mô hình **3 tầng**: Client giao tiếp với **API server** qua HTTP/JSON (xác thực JWT), API server xử lý mọi nghiệp vụ và truy cập **Database** thông qua Prisma ORM. Client **không** kết nối trực tiếp vào CSDL.

```
+--------------------+   HTTP/JSON (JWT)   +------------------+   Prisma ORM   +-----------------+
|                    | -------------------> |                  | --------------> |                 |
|  ỨNG DỤNG CLIENT   |                      |    API SERVER    |                 | DATABASE SERVER |
|  React + Vite      | <------------------- |  Node.js/Express | <-------------- | PostgreSQL 16  |
+--------------------+   JSON response      +------------------+                 +-----------------+
```

- **Client** (`frontend/`): React + Vite + Ant Design. Gọi API qua axios (`/api/v1/*`), không thao tác trực tiếp Database.
- **API Server** (`backend/`): Express chia tầng **Controller → Service → Repository → Prisma**; xác thực JWT (Access + Refresh), phân quyền RBAC theo vai trò, validate dữ liệu đầu vào bằng Zod.
- **Database**: PostgreSQL 16 chạy trong Docker (cổng 5433), cấu trúc bảng quản lý bằng Prisma migrations + seed dữ liệu mẫu.

## Cấu trúc dự án

```
balo-tui-store/
├── backend/            # API Express (Prisma, swagger)
├── frontend/           # React + Vite + Ant Design
├── docker-compose.yml  # PostgreSQL 16 (cổng 5433)
└── README.md
```

---

# HƯỚNG DẪN CHẠY TỪNG BƯỚC

> Áp dụng khi mở dự án bằng **VS Code / JetBrains / terminal (PowerShell, cmd)** trên máy **Windows**.

## Yêu cầu cài sẵn (chạy **một lần** đầu tiên)

1. **Docker Desktop** đang chạy (chạy lệnh `docker ps` thấy danh sách không báo lỗi).
2. **Node.js** >= 18 (chạy `node -v` để kiểm tra).
3. **Git** (tùy chọn, nếu lấy code từ repo).

---

## BƯỚC 1 — Khởi động PostgreSQL bằng Docker

`docker-compose.yml` sẽ tạo container **PostgreSQL 16** với:
- Container: `balo_postgres` — user `balo_admin`, db `balo_store`
- Cổng host: **5433** (tránh xung đột với Postgres mặc định 5432)
- Volume dữ liệu `balo_pg_data` (dữ liệu không mất khi tắt container)

Mở terminal tại **thư mục gốc dự án** (`balo-tui-store/`) và chạy:

```bash
# Bật container Postgres nền
docker compose up -d db

# Kiểm tra container đã healthy chưa
docker ps
```

Dòng `balo_postgres ... Up ... (healthy)` = OK. Nếu chưa healthy, đợi ~10 giây rồi chạy lại `docker ps`.

Để tắt/khởi động lại tạm:

```bash
docker compose stop db     # tắt (dữ liệu giữ nguyên)
docker compose start db    # bật lại
```

> Lưu ý: cổng **5433** (mặc định config), user/password lấy trong `docker-compose.yml`
> và `backend/.env` — thay đổi phải sửa **cả 2 chỗ** cho khớp.
>
> 📌**Giảng viên lưu ý:** dự án cấu hình sẵn **Postgres cổng 5433** vì máy sinh viên dùng
> sẵn cổng 5432. Nếu máy giảng viên dùng cổng mặc định **5432**, hãy đổi sang 5432 ở
> **cả 2 chỗ**:
> 1. `docker-compose.yml`: dòng `ports` đổi từ `"5433:5432"` → `"5432:5432"`.
> 2. `backend/.env`: `DATABASE_URL` đổi host port `5433` → `5432`. Sau đó
>    `docker compose up -d db` rồi `npm run prisma:migrate` + `npm run seed`.

---

## BƯỚC 2 — Chạy Backend

```bash
cd backend
copy .env.example .env     # Windows (PowerShell); macOS/Linux: cp .env.example .env
npm install                # cài dependencies (lần đầu)
npm run prisma:migrate     # đồng bộ CSDL (migrate)
npm run seed               # nạp dữ liệu mẫu + tài khoản demo
npm run dev                # chạy server (nodemon, cổng 3000)
```

Backend chạy tại **http://localhost:3000** — thấy log `... listening on 3000` là OK.
- Tài liệu API (Swagger): `http://localhost:3000/api/docs`
- Kiểm tra sức khỏe: `http://localhost:3000/api/v1/system/health`

Cấu hình nằm trong `backend/.env` (Port 3000, DATABASE_URL, JWT secret, CORS `CLIENT_URL`).

---

## BƯỚC 3 — Chạy Frontend

Mở **terminal thứ hai** (giữ backend chạy):

```bash
cd frontend
npm install          # cài dependencies (lần đầu)
npm run dev          # vite dev, cổng 5173
```

Frontend chạy tại **http://localhost:5173** — mở trình duyệt vào đây.
- `vite.config.js` đã proxy `/api` và `/uploads` → backend :3000 (không cần cấu hình thêm).

---

## BƯỚC 4 — Đăng nhập (tài khoản demo)

| Vai trò | Username | Password |
|---|---|---|
| Quản trị | `admin` | `admin123` |
| Nhân viên bán hàng | `sales` | `sales123` |
| Nhân viên kho | `warehouse` | `warehouse123` |
| Quản lý | `manager` | `manager123` |

---

## Kiểm tra quan trọng sau khi chạy

| Kiểm tra | Lệnh / URL | Mong đợi |
|---|---|---|
| PostgreSQL | `docker ps` | `balo_postgres` = healthy |
| Backend | `http://localhost:3000/api/v1/system/health` | `{ status: ok }` |
| Frontend | `http://localhost:5173` | Trang đăng nhập |
| Đăng nhập | Tài khoản `admin/admin123` | Vào dashboard |

---

## Lệnh dev thường dùng

```bash
# Backend
npm run prisma:generate   # sinh lại Prisma Client khi đổi schema.prisma
npm run lint              # kiểm tra lỗi (oxlint) — frontend
npm run build             # build production — frontend (backend: không build, dùng dev)
```

---

## Gỡ rối nhanh

- **Không vào được 5173** → chắc vite chưa chạy: mở lại terminal thứ 2, chạy `npm run dev`.
- **Backend lỗi kết nối DB** → chưa chạy Docker: chạy `docker compose up -d db` rồi thử lại.
- **Cổng 5433 bị bận** → đổi cổng ở `docker-compose.yml` và `backend/.env` cho khớp, rồi `docker compose up -d db` lại.
- **Menu/trang trắng sau đăng nhập theo role** → nhấn **Ctrl+F5** (hard refresh) để nạp code mới từ vite HMR.

---

## Cập nhật gần đây

### Cài đặt hệ thống — Liên hệ hỗ trợ (2026-09-18)

- **DB**: bảng `app_settings` (key-value) — migration `add_app_settings`.
- **Backend**: `GET /api/v1/settings/public` (mọi role đọc); `PUT /api/v1/settings` (**ADMIN** chỉnh, validate whitelist khóa: `support_hotline`, `support_zalo`, `support_email`).
- **Frontend**:
  - Header (mọi role) nút **"Hỗ trợ"**: hiển thị hotline (`tel:`), nút **Chat qua Zalo** (`zalo.me`, tab mới), email — đọc từ cài đặt trong DB (fallback số demo nếu chưa đặt).
  - Trang **Cài đặt** (`/settings`, chỉ ADMIN) chỉnh hotline / Zalo / email rồi lưu, không cần sửa code.
- **Số hiện tại**: `support_hotline=1900 0000`, `support_zalo=0900000000`, `support_email=hotro@balotuixach.vn` (demo) — admin đổi được ngay trên giao diện.
- **Lệnh cần chạy sau khi lấy code mới**: `npm run prisma:generate` + `npm run prisma:migrate` (backend).

> Ghi chú chi tiết đầy đủ: xem `docs/ghi-chu-cap-nhat.md`.

### Mã vạch sản phẩm (2026-09-18)

- **DB**: thêm cột `products.barcode` (unique, nullable) — migration `add_product_barcode`; mã vạch mặc định theo chuẩn **EAN-13** (13 chữ số, có số kiểm tra).
- **Backend**:
  - Tạo/sửa sản phẩm (hoặc import Excel) nhận thêm `barcode`, chặn mã vạch trùng.
  - **Tự sinh EAN-13** khi tạo sản phẩm bỏ trống mã vạch (sinh từ id sản phẩm, ổn định).
  - Tìm kiếm sản phẩm mở rộng theo **mã vạch** (`GET /api/v1/products?search=...`).
  - API `GET /api/v1/products/by-barcode/:code` để POS quét mã nhanh.
  - Backfill tự động mã vạch cho sản phẩm đang có (không cần reseed).
- **Frontend**:
  - Trang **Sản phẩm**: cột "Mã vạch" (hiển thị hình mã vạch + số), form thêm/sửa có nút **"Tự sinh"** + xem trước mã vạch, file mẫu import/xuất Excel thêm cột "Mã vạch".
  - **In nhãn mã vạch**: nút "In nhãn" trên từng sản phẩm hoặc hàng loạt (in nhãn dán: tên + SKU + giá + mã vạch, dùng A4/thư viện `jsbarcode`).
  - **POS**: ô "Quét mã vạch..." tự động focus — máy quét (gõ số + Enter) tự tìm sản phẩm và thêm vào giỏ hàng, quét liên tục không cần chạm chuột; ô tìm kiếm cũng khớp theo mã vạch.
- **Lệnh cần chạy sau khi lấy code mới**: `npm run prisma:generate` + `npm run prisma:migrate` (backend), `npm install` (frontend, có thêm `jsbarcode`).
- **Lưu ý**: mã vạch nhập tay có ký tự chữ/số vẫn hiển thị được (dùng Code128); bỏ trống mã vạch khi tạo vẫn được hệ thống tự sinh.

> Ghi chú chi tiết đầy đủ: xem `docs/ghi-chu-cap-nhat.md`.

### Vận đơn giao hàng (2026-09-18)

- **DB**: thêm enum `ShipmentStatus` + 2 bảng `delivery_partners` (đối tác giao hàng) và `shipments` (vận đơn) — migration `add_delivery_and_shipment`.
- **Backend** (đúng pattern controller/service/repository/routes hiện có):
  - `GET/POST/PUT/DELETE /api/v1/delivery-partners` (+ `GET /delivery-partners/all` để lấy danh sách nhanh).
  - `GET/POST/PUT/PATCH /api/v1/shipments` và `PATCH /shipments/:id/status`.
  - Trạng thái vận đơn: `PENDING_PICKUP` → `IN_TRANSIT` → `DELIVERED` / `FAILED` (có validate luồng chuyển trạng thái).
  - Tự sinh mã vận đơn `VD-YYYYMMDD-xxxxxx`; chỉ cho 1 vận đơn đang hoạt động/đơn hàng; mặc định thông tin người nhận lấy từ khách hàng của đơn.
  - **Đồng bộ trạng thái đơn hàng tự động**: vận đơn `IN_TRANSIT` → đơn `SHIPPING`; vận đơn `DELIVERED` → đơn `COMPLETED` (ghi `deliveredAt`).
  - Phân quyền: xem → mọi role đã đăng nhập; tạo/sửa/đổi trạng thái vận đơn → `ADMIN`, `WAREHOUSE`; quản lý đối tác → `ADMIN`.
- **Frontend**:
  - Trang mới **Vận đơn** (`/shipments`) gồm 2 tab: **Vận đơn** (bảng, lọc theo mã/trạng thái/đối tác/khoảng ngày, tạo vận đơn, xem chi tiết, sửa, đổi trạng thái nhanh) và **Đối tác giao hàng** (CRUD + bật/tắt hoạt động).
  - Thêm menu "Vận đơn", route, `shipment.service.js`, `deliveryPartner.service.js`.
- **Seed**: thêm 5 đối tác giao hàng (GHN, GHTK, Viettel Post, Shopee Express, J&T) và vận đơn mẫu cho các đơn chưa hoàn thành.
- **Lệnh cần chạy sau khi lấy code mới**: `npm run prisma:generate` (backend) rồi (`npm run seed` nếu muốn nạp lại dữ liệu mẫu).
- **Lưu ý**: vận đơn mẫu trong seed gắn theo trạng thái đơn ngẫu nhiên khi reseed; khi demo thay đổi trạng thái vận đơn sang `DELIVERED` sẽ tự chuyển đơn hàng thành `COMPLETED`.

> Ghi chú chi tiết đầy đủ: xem `docs/ghi-chu-cap-nhat.md`.

### Lưu phương thức thanh toán vào đơn (2026-09-16)

- **DB**: thêm enum `PaymentMethod` (`CASH` / `TRANSFER` / `CARD`) và cột `orders.paymentMethod` mặc định `CASH` (migration `add_order_payment_method`).
- **Backend**: API tạo đơn `POST /api/v1/orders` nhận thêm `paymentMethod` (đã validate enum, mặc định `CASH`); giá trị được ghi vào đơn khi tạo đơn tại POS.
- **Frontend POS**: bổ sung ô chọn **Phương thức** (Tiền mặt / Chuyển khoản / Thẻ) ở giỏ hàng, gửi kèm `paymentMethod` khi **THANH TOÁN**.
- **Giá trị dùng chung**: `CASH` = Tiền mặt, `TRANSFER` = Chuyển khoản, `CARD` = Thẻ.
- **Lệnh cần chạy sau khi lấy code mới**: `npm run prisma:generate` (backend) để cập nhật Prisma Client; backend/frontend tự reload bằng `npm run dev`.

> Ghi chú chi tiết đầy đủ: xem `docs/ghi-chu-cap-nhat.md`.

# README — Chạy nhanh Balo - Túi xách

> File ghi chú sau khi đã cài đặt xong (2026-09-16). Dùng khi **mở lại project lần sau**.
> File này KHÔNG thay thế `README.md` gốc — chỉ là bản hướng dẫn nhanh.

---

## 1. CÁC BƯỚC ĐÃ CÀI XONG (không cần làm lại)

Những bước dưới đây **chỉ chạy 1 lần** và đã hoàn thành:

| Bước | Lệnh đã chạy | Trạng thái |
|---|---|---|
| Docker Desktop | Đã cài sẵn, đã kiểm tra daemon hoạt động | ✅ |
| PostgreSQL (Docker) | `docker compose up -d db` — container `balo_postgres` healthy, port 5433 | ✅ |
| Cài backend | `cd backend && npm install` | ✅ (`node_modules` đã có) |
| Cài frontend | `cd frontend && npm install` | ✅ (`node_modules` đã có) |
| Đồng bộ schema DB | `npm run prisma:migrate` (2 migrations, up to date) | ✅ |
| Seed dữ liệu demo | Dữ liệu đã có sẵn: 5 users / 30 products / 41 orders | ✅ |

> **Chỉ khi đổi `schema.prisma`** mới cần chạy lại:
> `cd backend && npm run prisma:generate && npm run prisma:migrate`
>
> **Chỉ khi muốn reset dữ liệu demo**: `cd backend && npm run seed`

---

## 2. LẦN SAU MỞ PROJECT — CHỈ CẦN CHẠY 3 LỆNH

Mở 3 terminal PowerShell (hoặc trong VS2026: `View > Terminal`, nút `+`):

### Terminal 1 — Khởi động Database (nếu Docker chưa chạy)

```powershell
cd C:\path\to\balo-tui-store
docker compose start db
```

> Nếu báo lỗi "Cannot connect to Docker daemon": mở **Docker Desktop** trước, đợi ~30s, chạy lại.
> Nếu báo "No such container": chạy `docker compose up -d db` thay vì `start`.

### Terminal 2 — Backend API (port 3000)

```powershell
cd C:\path\to\balo-tui-store\backend
npm run dev
```

Thấy log `listening on 3000` là OK.

### Terminal 3 — Frontend (port 5173)

```powershell
cd C:\path\to\balo-tui-store\frontend
npm run dev
```

Thấy `Local: http://localhost:5173/` là OK — mở trình duyệt vào đó.

---

## 3. KIỂM TRA NHANH

| Kiểm tra | URL | Mong đợi |
|---|---|---|
| Database | `docker ps` | `balo_postgres` healthy |
| Backend | `http://localhost:3000/api/v1/system/health` | `{ status: "ok" }` |
| Swagger | `http://localhost:3000/api-docs` | Trang API docs |
| Frontend | `http://localhost:5173` | Trang đăng nhập |
| Đăng nhập | `admin` / `admin123` | Vào Dashboard |

---

## 4. TÀI KHOẢN DEMO

| Vai trò | Username | Password |
|---|---|---|
| Quản trị | `admin` | `admin123` |
| Nhân viên bán hàng | `sales` | `sales123` |
| Nhân viên kho | `warehouse` | `warehouse123` |
| Quản lý | `manager` | `manager123` |

---

## 5. GỠ RỐI NHANH

| Lỗi | Cách sửa |
|---|---|
| `Cannot connect to Docker daemon` | Mở Docker Desktop, đợi 30s, chạy lại lệnh |
| Port 3000/5173 bị chặn bởi file tường lửa | Cho phép Node.js qua firewall / log |
| Backend lỗi DB | Kiểm tra Docker chạy chưa (`docker ps`), xem `backend/.env` |
| Frontend không tải được API | Kiểm tra backend đang chạy — Vite proxy `/api` → :3000 |
| Trang dashboard trắng sau login | Bấm **Ctrl+F5** (hard refresh) — Vite HMR |
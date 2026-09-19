# Ghi chú cập nhật — Đợt thanh toán / hủy đơn / in hóa đơn

Ngày: 2026-09-16
Nhánh repo: `balo-tui-store` (backend Express+Prisma / frontend React+Vite+AntD)

---

## 1. Lưu phương thức thanh toán vào đơn (hoàn tất)

**Mục đích:** khi bán hàng ở POS, chọn được cách khách trả (Tiền mặt / Chuyển khoản / Thẻ) và **lưu lại vào đơn** để báo cáo/biết sau.

| Nơi | Thay đổi |
|---|---|
| `backend/prisma/schema.prisma` | Thêm enum `PaymentMethod { CASH, TRANSFER, CARD }` + field `Order.paymentMethod PaymentMethod @default(CASH)` |
| Migration | `add_order_payment_method` — đã tạo + apply xuống Postgres (`docker exec` truy vấn thấy cột + enum) |
| `backend/src/validations/index.js` | `orderSchemas.create.body` có `paymentMethod` là enum CASH/TRANSFER/CARD, default `CASH` |
| `backend/src/services/order.service.js` | `create()` nhận + ghi `paymentMethod` vào `tx.order.create` |
| `frontend/src/pages/POS.jsx` | Có `<Select>` "Phương thức:" (Tiền mặt/Chuyển khoản/Thẻ) + đưa `paymentMethod` vào payload tạo đơn |

**Ghi chú quan trọng (tránh lệch 2 đầu):**
- Giá trị dùng chung: `CASH`=Tiền mặt, `TRANSFER`(backend) = `Chuyển khoản`(UI), `CARD`=Thẻ.
- POS không chọn → mặc định `CASH`, không vỡ luồng cũ.
- **Tạm hoãn** tin nhắn của bạn: "phần thanh toán thẻ còn cần liên kết ngân hàng, khá phức tạp" → **CHƯA làm** tích hợp cổng thanh toán thật (webhook, mã QR thu ngân...). Hiện `TRANSFER/CARD` chỉ là **gắn nhãn**, chưa đụng ngân hàng.

## 2. Hủy đơn + cộng lại kho (hoàn tất)

- Backend **đã có sẵn** logic: `order.service.updateStatus` khi status → `CANCELLED` sẽ **hoàn lại stock** từng sản phẩm + tạo `StockLog` (type `CANCEL`).
- Frontend thiếu nút → **đã thêm** trong `frontend/src/pages/Orders.jsx`:
  - Import thêm `Popconfirm` + `CloseOutlined`.
  - Cột "Thao tác" hiện có nút 🔴 **Hủy đơn** (chỉ hiện khi trạng thái `PENDING`), bọc `Popconfirm` xác nhận trước khi hủy.

## 3. In hóa đơn 80mm tại POS (đã có sẵn, xác nhận hoạt động)

- `POS.jsx` trang bị đầy đủ từ trước: state `lastOrder` + `printOpen`, và sau khi thanh toán thành công tự `setLastOrder(res.data) + setPrintOpen(true)` → **modal in hóa đơn bật ngay**.
- Trong modal: mã đơn, ngày, khách, nhân viên, danh sách sản phẩm + số lượng, tổng cộng; nút **In hóa đơn** gọi `window.print()` với CSS chỉ in vùng `#receipt-area` (in máy in khổ giấy 80mm / nhiệt).

## 4. Trạng thái chạy hiện tại

- Backend: `http://localhost:3000` — health OK.
- Frontend: `http://localhost:5173` — Vite dev, đã build pass (cảnh báo chunk-size là không ảnh hưởng).
- Tài khoản demo: `admin/admin123`, `sales/sales123`, `warehouse/warehouse123`, `manager/manager123`.

## 5. Việc tiếp theo (chờ chốt — ưu tiên đề xuất)

Theo danh sách bạn gửi, mức độ triển khai:
- **Ưu tiên cao:** In hóa đơn ✅ · Tiền thừa (input khách trả → tiền thừa) · Chiết khấu đơn · Ghi chú thanh toán.
- **Ưu tiên trung bình:** Tạm giữ giỏ · Mã giảm giá · VAT · Ghi nợ khách.
- **Nâng cao:** Kết nối máy in khi thanh toán + in tự động · Hóa đơn chi tiết · Hủy đơn ✅.

**Đã dứt điểm: In hóa đơn + Hủy đơn + Lưu phương thức.**
Mục tiếp theo tôi ưu tiên làm: **Tiền thừa** (nhập "Khách trả" → tự tính tiền thừa) hoặc **Chiết khấu đơn** — bạn chọn.

---

# Ghi chú cập nhật — Mã vạch sản phẩm

Ngày: 2026-09-18 (sau tính năng Vận đơn giao hàng)

## Tính năng: Mã vạch (barcode) cho sản phẩm

**Mục đích:** cửa hàng thực tế dùng mã vạch; cần tạo/quản lý mã vạch sản phẩm, quét nhanh ở POS và in nhãn dán tem.

| Nơi | Thay đổi |
|---|---|
| `backend/prisma/schema.prisma` | Thêm `Product.barcode String? @unique` |
| Migration | `add_product_barcode` — thêm cột nullable + unique index (đã apply qua `prisma migrate deploy`) |
| `backend/prisma/seed.js` | Khi seed, mỗi sản phẩm được gán mã vạch EAN-13 sinh từ id |
| `backend/src/utils/barcode.js` (mới) | Sinh/xác thực EAN-13 (`ean13FromId`, `makeEan13`, `isValidEan13`) |
| `backend/src/repositories/product.repository.js` | Thêm `findByBarcode` |
| `backend/src/services/product.service.js` | Create/update/import: nhận `barcode`, chặn trùng, **tự sinh EAN-13 nếu bỏ trống**; list search thêm `barcode`; thêm `getByBarcode` cho POS |
| `backend/src/controllers/product.controller.js` + `routes/product.routes.js` | Thêm `GET /api/v1/products/by-barcode/:code` |
| `backend/src/validations/index.js` | `productSchemas` thêm field `barcode` (create/update) |
| Backfill (1 lần) | Chạy script gán mã vạch EAN-13 cho sản phẩm đang có, không reseed |
| `frontend` | Cài `jsbarcode`; `src/utils/barcode.js` + `index.css` (style in nhãn) |
| `frontend/src/pages/Products.jsx` | Cột "Mã vạch" (hình mã vạch + số); form có nút "Tự sinh" + xem trước; import/export Excel thêm cột "Mã vạch"; nút "In nhãn" (từng sản phẩm hoặc hàng loạt) |
| `frontend/src/pages/POS.jsx` | Ô "Quét mã vạch..." (autoFocus, Enter → tìm sản phẩm bằng `GET /products/by-barcode/:code` → thêm vào giỏ, tự xóa và giữ focus); ô tìm kiếm khớp theo mã vạch |
| `frontend/src/services/product.service.js` | Thêm `getByBarcode` |

**Quyết định đã chốt (theo mặc định khuyến nghị):**
- Tự sinh EAN-13 khi tạo sản phẩm bỏ trống mã vạch.
- POS có ô quét mã vạch chuyên dụng (máy quét gõ số + Enter, quét liên tục).
- Có in nhãn mã vạch (nhãn: tên + SKU + giá + mã vạch).
- Sản phẩm cũ được backfill mã vạch, giữ nguyên dữ liệu (không reseed).

**Lưu ý:**
- Mã vạch nhập tay có chữ/số (không phải EAN-13) vẫn in/hiển thị được nhờ format `CODE128` của jsbarcode.
- EAN-13 = 13 chữ số (12 + số kiểm tra); `ean13FromId(id)` = `890 + (9 chữ số của id)` ổn định và duy nhất.
- Validate: `barcode` trùng sẽ bị chặn (400) ở create/update/import.
- Test: `node --test tests/smoke.test.js` — 16/16 pass (đã thêm test barcode: lookup by code, auto-gen EAN-13, chặn trùng, search theo mã vạch).

---

# Ghi chú cập nhật — Liên hệ hỗ trợ

Ngày: 2026-09-18

## Tính năng: Nút "Liên hệ hỗ trợ" (kiểu KiotViet)

**Mục đích:** người dùng bấm vào hỗ trợ sẽ thấy số hotline gọi nhanh và nút dẫn qua Zalo để chat.

| Nơi | Thay đổi |
|---|---|
| `frontend/src/components/SupportContact.jsx` (mới) | Popover hiển thị: nút **Hotline** (`tel:`), nút **Chat qua Zalo** (`https://zalo.me/...` tab mới, màu xanh Zalo), email. Hằng số `SUPPORT_CONFIG` chứa thông tin liên hệ |
| `frontend/src/layouts/MainLayout.jsx` | Thêm `<SupportContact />` bên cạnh dropdown user ở header (mọi role) |

**Lưu ý:**
- Số liên hệ đang là **demo**: hotline `1900 0000`, Zalo `0900000000`, email `hotro@balotuixach.vn` — (đã có bản nâng cấp: admin tự chỉnh trên trang Cài đặt, xem mục dưới).
- Link Zalo dùng `https://zalo.me/<sđt>` (mở Zalo web/app khi có sđt đã đăng ký Zalo); nếu dùng Zalo OA thì thay bằng `https://zalo.me/<oa_id>`.
- Không thay đổi backend/DB; đã build + lint pass (chỉ warning sẵn có).

---

# Ghi chú cập nhật — Cài đặt hệ thống (admin tự điều chỉnh)

Ngày: 2026-09-18

## Tính năng: Cài đặt liên hệ hỗ trợ lưu DB, admin tự sửa

**Mục đích:** admin không cần nhờ dev sửa code; vào trang Cài đặt tự đổi hotline/Zalo/email, lưu xuống DB, nút "Hỗ trợ" đọc hiển thị ngay.

| Nơi | Thay đổi |
|---|---|
| `backend/prisma/schema.prisma` | Thêm model `AppSetting` (key-value, `isSecret`) |
| Migration | `add_app_settings` (đã apply) |
| `backend/src/repositories/appSetting.repository.js` (mới) | `findMany` / `findByKey` / `upsert` |
| `backend/src/services/appSetting.service.js` (mới) | `getPublic()` (không secret), `update()` — **whitelist** khóa `support_hotline`, `support_zalo`, `support_email`, giá trị rỗng → null |
| `backend/src/controllers/appSetting.controller.js` + `routes/appSetting.routes.js` (mới) | `GET /api/v1/settings/public`; `PUT /api/v1/settings` (ADMIN, validate `.strict()` từ chối khóa lạ) |
| `backend/src/routes/index.js` | Đăng ký `/settings` |
| `backend/src/validations/index.js` | `appSettingSchemas.update` |
| `backend/prisma/seed.js` | Seed 3 cài đặt mặc định |
| `frontend/src/services/settings.service.js` (mới) | `getPublic()` / `update()` |
| `frontend/src/components/SupportContact.jsx` | Đọc `GET /settings/public` (refetch khi mở popover), fallback số demo; tự suy `tel:` và `zalo.me` nếu chỉ nhập số |
| `frontend/src/pages/Settings.jsx` (mới) | Trang Cài đặt (ADMIN): form hotline/Zalo/email + Lưu |
| `frontend/src/App.jsx` + `MainLayout.jsx` | Route `/settings` (ADMIN) + menu "Cài đặt" |

**Phân quyền:** xem thông tin hỗ trợ → mọi role đã đăng nhập (`GET /settings/public`); chỉnh cài đặt → `ADMIN` (`PUT /settings`).

**Lưu ý:**
- Khóa lạ bị chặn (400) cả ở zod `.strict()` lẫn whitelist service.
- Giá trị rỗng → lưu null (nút Hỗ trợ fallback về số demo).
- Test: `node --test tests/smoke.test.js` — **17/17 pass** (thêm test settings: public đọc được, SALES bị chặn ghi, khóa lạ bị chặn, ADMIN sửa/khôi phục).
- Phần mềm sẵn sàng mở rộng: thêm khóa mới vào `ALLOWED_SETTING_KEYS`, schema zod, và form trang Cài đặt.

# 📘 HƯỚNG DẪN NGHIỆP VỤ NHẬP LIỆU — Hệ thống Balo - Túi xách

> Áp dụng cho toàn bộ luồng nhập liệu vận hành: **từ nhập hàng về kho cho đến thêm mới sản phẩm, bán hàng, quản lý khách hàng…**
> Đọc kèm `README.md` (cách chạy hệ thống) và tài khoản demo ở mục 1.

---

## 1. Tài khoản và quyền nhập liệu theo vai trò

| Vai trò | Tài khoản demo | Quyền liên quan nhập liệu |
|---|---|---|
| **Quản trị** | `admin` / `admin123` | Toàn quyền: mọi màn hình, thêm/sửa/xóa tất cả |
| **Nhân viên bán hàng** | `sales` / `sales123` | Khách hàng (thêm/sửa), Bán hàng POS, Đơn hàng |
| **Nhân viên kho** | `warehouse` / `warehouse123` | Nhà cung cấp (thêm/sửa, **không xóa**), Đơn nhập hàng (tạo/duyệt/nhập kho), Điều chỉnh tồn kho, Lịch sử tồn kho |
| **Quản lý** | `manager` / `manager123` | **Chỉ xem**: báo cáo, đơn nhập (đọc) |

> Nguyên tắc chung: muốn **nhập hàng** thì phải có quyền **ADMIN hoặc WAREHOUSE**; muốn **bán hàng/thêm khách** thì dùng **ADMIN hoặc SALES**.

---

## 2. Danh mục sản phẩm (menu: Sản phẩm ⇢ nút "Thêm danh mục")

> Menu gốc: **Danh mục** (`/categories`). Tạo danh mục **trước** khi tạo sản phẩm.

| Ô nhập | Bắt buộc | Ghi chú |
|---|---|---|
| Tên danh mục | ✅ | VD: "Balo", "Túi xách", "Ví da" |
| Mô tả | — | Tùy chọn |
| Trạng thái | — | "Hoạt động" (mặc định) / "Ẩn" |

**Lưu ý**
- Chỉ **ADMIN** mới thêm/sửa/xóa danh mục.
- Khi tạo sản phẩm, tên danh mục trong file Excel phải **trùng chính xác** tên danh mục đang có (xem mục 3.4), nếu không dòng đó báo lỗi.

---

## 3. Sản phẩm (menu: **Sản phẩm** `/products`)

### 3.1 Thêm mới sản phẩm một sản phẩm
Nhấn **"Thêm sản phẩm"** (chỉ ADMIN thấy) rồi điền:

| Ô nhập | Bắt buộc | Ghi chú |
|---|---|---|
| Hình ảnh sản phẩm | — | Chọn ảnh (jpg/png/gif/webp, ≤ 5MB) — không bắt buộc |
| Tên sản phẩm | ✅ | |
| SKU | ✅ | **Phải duy nhất** — VD: `SKU001`, `BALO-NAVY` |
| Mã vạch (barcode) | — | Bỏ trống thì để `—`; nút **"Tự sinh"** tạo mã chuẩn **EAN-13** (13 chữ số); **không được trùng** mã của sản phẩm khác |
| Danh mục | ✅ | Chọn từ danh sách đã tạo ở mục 2 |
| Giá bán (₫) | ✅ | > 0 |
| Giá vốn (₫) | — | Mặc dù nhập được, **giá vốn thực tế sẽ được cập nhật lại = đơn giá của lần nhập kho gần nhất** (xem mục 5.4) |
| Tồn kho ban đầu | — | Số nguyên ≥ 0 (mặc định 0) |
| Màu sắc | — | VD: "Xanh navy", "Đen" |
| Mô tả | — | |
| Trạng thái | — | "Hoạt động" (mặc định) / "Ẩn" |

Sau khi tạo, tồn kho có thể điều chỉnh bằng nút **"Tồn kho"** ở dòng sản phẩm hoặc tăng qua **Đơn nhập hàng** (mục 5 — khuyến nghị).

### 3.2 Sửa / ẩn / xóa
- **Sửa**: ADMIN — mở lại form, nhấn **Lưu**.
- **Ẩn/Hoạt động**: tắt/mở Switch cột "Trạng thái" (ADMIN). Sản phẩm Ẩn sẽ không còn trong danh sách bán hàng.
- **Xóa**: ADMIN — chỉ xóa được khi sản phẩm **chưa nằm trong đơn hàng/đơn nhập**; nếu đã phát sinh giao dịch thì hệ thống chặn, nên **Ẩn** thay vì xóa.
- **Lưu ý mã vạch/SKU**: sửa trùng SKU hoặc mã vạch sẽ bị chặn.

### 3.3 Điều chỉnh tồn kho thủ công + Lịch sử tồn kho
- Nút **"Tồn kho"** (ADMIN/WAREHOUSE): nhập **số lượng mới**, hệ thống ghi nhận thay đổi → có trong **Lịch sử tồn kho** (loại `ADJUST`).
- Nút **"Lịch sử"**: xem biến động `trước → sau`, loại ghi nhận:
  - `IMPORT` — nhập hàng theo đơn nhập
  - `EXPORT` — bán hàng (POS/đơn hàng)
  - `CANCEL` — hoàn kho khi hủy đơn
  - `ADJUST` — điều chỉnh thủ công
- Khuyến nghị: **ưu tiên điều chỉnh tồn kho qua Đơn nhập hàng** (mục 5) để lịch sử rõ ràng, hạn chế sửa tay.

### 3.4 Import / Export Excel (chỉ ADMIN)
Trên trang Sản phẩm có 3 nút:
- **"Tải file mẫu"** — tải file `.xlsx` mẫu gồm các cột:
  `Tên sản phẩm, SKU, Mã vạch, Danh mục, Giá bán, Giá vốn, Tồn kho, Màu sắc, Mô tả, Trạng thái`
- **"Import Excel"** — chọn file, hệ thống nhập hàng loạt và báo **số dòng thành công / thất bại** kèm lỗi từng dòng.

**Điều kiện khi import**
1. Nhập 2 dòng ví dụ trong file mẫu; cột **"Danh mục"** phải trùng tên danh mục đang có.
2. **SKU trùng** trong hệ thống → dòng lỗi.
3. **Mã vạch trùng** với sản phẩm khác (hoặc lặp trong file) → dòng lỗi.
4. "Giá bán"/"Tồn kho" gõ **số**, không dùng dấu phân cách nghìn.
5. "Trạng thái": `Hoạt động` hoặc bỏ trống.

- **"Xuất Excel"** — tải toàn bộ sản phẩm ra `.xlsx`, dùng làm danh sách kiểm kê, chỉnh giá, rồi nhập lại.

### 3.5 In nhãn mã vạch
- Nút **"In nhãn"** (in hàng loạt toàn bộ danh sách đang hiển thị) hoặc nút **"Nhãn"** ở từng dòng.
- Nhãn gồm: tên sản phẩm + SKU + giá bán + mã vạch (dùng cho dán kệ/kệ hàng, quẹt tại quầy).
- Chỉ in được nhãn khi sản phẩm **đã có mã vạch**; sản phẩm chưa có mã vạch in nhãn sẽ **trống mã** — hãy bấm "Tự sinh" khi sửa sản phẩm nếu cần.

---

## 4. Nhà cung cấp (menu: **Nhà cung cấp** `/suppliers`)

> Nhập hàng bắt đầu từ đây: muốn tạo Đơn nhập hàng thì **bắt buộc có nhà cung cấp đang Hoạt động**.

| Ô nhập | Bắt buộc | Ghi chú |
|---|---|---|
| Mã nhà cung cấp | ✅ | **Phải duy nhất**, VD: `NCC001` |
| Tên nhà cung cấp | ✅ | **Phải duy nhất** (hệ thống không cho trùng mã hoặc tên) |
| Số điện thoại | — | |
| Email | — | Phải là email hợp lệ nếu nhập |
| Địa chỉ | — | |
| Mã số thuế | — | |
| Ghi chú | — | |
| Trạng thái | — | "Hoạt động" / "Tắt" |

**Quyền**: ADMIN/WAREHOUSE thêm & sửa; chỉ **ADMIN xóa**.

**Lưu ý quan trọng**
- **Không xóa được** nhà cung cấp đã có đơn nhập → nên **"Tắt"** (Switch) thay vì xóa.
- **NCC đang "Tắt" thì không lập đơn nhập được** (hệ thống chặn ngay khi lưu).

---

## 5. Đơn nhập hàng (menu: **Đơn nhập hàng** `/purchase-orders`) — LUỒNG TRỌNG TÂM

> Đây là cách **chuẩn nhất** để tăng tồn kho cho sản phẩm. Quy trình bắt buộc gồm **3 bước**:

```
Bước 1: TẠO ĐƠN (PENDing — "Chờ duyệt")
      │
Bước 2: DUYỆT (APPROVED — "Đã duyệt")
      │
Bước 3: NHẬP KHO (RECEIVED — "Đã nhập kho")  ⭐ → tồn kho tăng + ghi log
```

### Bước 1 — Tạo đơn nhập
Nhấn **"Tạo đơn nhập"** (ADMIN/WAREHOUSE):

| Ô nhập | Bắt buộc | Ghi chú |
|---|---|---|
| Nhà cung cấp | ✅ | Chọn NCC **đang Hoạt động** |
| Ghi chú | — | |
| Danh sách sản phẩm | ✅ ≥ 1 | Mỗi dòng: **Sản phẩm** (chọn từ danh sách), **Số lượng** (> 0), **Giá nhập** (≥ 0) |

- Bấm **"+ Thêm sản phẩm"** để thêm dòng; nút xoá dòng không xoá được khi chỉ còn 1 dòng.
- **Giá nhập chính là cơ sở tính "Giá vốn"** sau khi nhập kho — điền chính xác.
- Tổng tiền hiển thị tự động = Σ (số lượng × giá nhập).
- Nhấn **"Tạo đơn nhập"**: đơn ở trạng thái **"Chờ duyệt"**.

### Bước 2 — Duyệt đơn
- Trên bảng, cột **"Trạng thái"** là dropdown — chọn **"Đã duyệt"**.
- (Có thể **"Đã hủy"** để bỏ đơn chưa duyệt — tồn kho không đổi.)

### Bước 3 — Nhập kho ⭐
- Chọn **"Đã nhập kho"** → hộp thoại **"Xác nhận nhập kho?"** nhắc: *tồn kho sẽ được cộng, giá vốn cập nhật, KHÔNG THỂ hoàn tác* → nhấn **"Nhập kho"**.

**Sau khi nhập kho, hệ thống TỰ ĐỘNG:**
1. **Tồn kho tăng** đúng số lượng từng sản phẩm.
2. **Giá vốn = đơn giá nhập mới nhất** của lần nhập này (thay giá vốn cũ).
3. Ghi **Lịch sử tồn kho** loại `IMPORT` (trước → sau, người nhập).

### ⚠️ Luồng trạng thái — đọc kỹ để không nhầm
| Từ | Được phép chuyển sang |
|---|---|
| Chờ duyệt (PENDING) | **Đã duyệt**, Đã hủy |
| Đã duyệt (APPROVED) | **Đã nhập kho**, Đã hủy |
| Đã nhập kho (RECEIVED) | *(kết thúc — không đổi)* |
| Đã hủy (CANCELLED) | *(kết thúc)* |

- **KHÔNG nhảy thẳng "Chờ duyệt" → "Đã nhập kho"** — hệ thống báo: *"Không thể chuyển trạng thái đơn nhập từ PENDING sang RECEIVED"*. Phải **duyệt trước, nhập kho sau** (đây là lỗi hay gặp nhất khi nhập liệu!).
- "Đã nhập kho" gửi lại **nhiều lần cũng không tăng tồn lần 2** (an toàn, không nhập kép).
- Đơn **đã nhập kho thì không hủy được**; đơn đã hủy/đã nhập không quay lại bước trước.

### Lưu ý khi sử dụng
- Muốn **nhập thêm hàng** cho NCC: tạo **đơn nhập mới** (đơn cũ đã nhập kho không thể sửa; làm đơn khác tiếp tục bước 1 – 3).
- Sản phẩm nào chưa có trong Danh mục → tạo sản phẩm ở mục 3 rồi mới lập đơn nhập.
- Nếu chọn NCC đang "Tắt hoạt động" → bị chặn: *"Nhà cung cấp đang bị tắt hoạt động"*.

---

## 6. Khách hàng (menu: **Khách hàng** `/customers`)

> Dùng khi bán hàng: có thể chọn khách lẻ (không lưu) hoặc khách đã lưu.

| Ô nhập | Bắt buộc | Ghi chú |
|---|---|---|
| Họ tên | ✅ | |
| Số điện thoại | ✅ | Tối thiểu 9 số |
| Email | — | Hợp lệ nếu nhập |
| Địa chỉ | — | |
| Giới tính | — | Nam / Nữ / Khác |

**Quyền**: ADMIN/SALES thêm–sửa; **chỉ ADMIN xóa**.

---

## 7. Bán hàng (menu: **Bán hàng (POS)** `/pos`) và Đơn hàng

### 7.1 Bán tại quầy (POS)
1. **Quét mã vạch**: ô "Quét mã vạch…" tự động lấy nét — máy quét gõ + Enter là **tự tìm và thêm sản phẩm** vào giỏ.
2. Tìm tay (khớp tên / SKU / mã vạch) rồi chọn sản phẩm.
3. Chọn số lượng; chọn **Phương thức thanh toán**: Tiền mặt (`CASH`) / Chuyển khoản (`TRANSFER`) / Thẻ (`CARD`).
4. Nhấn **THANH TOÁN** → hệ thống **trừ tồn kho**, in hóa đơn (hoặc QR thanh toán ngân hàng).

### 7.2 Đơn hàng (menu: **Đơn hàng** `/orders`)
- Xem danh sách, lọc theo trạng thái / khoảng ngày; xem chi tiết.
- Trạng thái đơn: `PENDING → CONFIRMED → SHIPPING → COMPLETED` (hoặc `CANCELLED`).
- **Hủy đơn PENDING/CONFIRMED** → **hoàn lại tồn kho** tự động (log `CANCEL`).
- Trạng thái đơn có thể được **đồng bộ tự động** khi cập nhật vận đơn (mục 8).

---

## 8. Vận đơn giao hàng (menu: **Vận đơn** `/shipments`)

- Cần có **Đối tác giao hàng** (GHN/GHTK/Viettel Post/Shopee Express/J&T — seed sẵn).
- Tạo vận đơn cho một đơn hàng (mã `VD-YYYYMMDD-xxxxxx`); một đơn chỉ có **1 vận đơn đang hoạt động**.
- Luồng: `Chờ lấy (§PENDING_PICKUP) → Đang giao (IN_TRANSIT) → Đã giao (DELIVERED)` hoặc `THẤT BẠI (FAILED)`.
- **Tự động đồng bộ**: vận đơn `IN_TRANSIT` → đơn về `SHIPPING`; vận đơn `DELIVERED` → đơn `COMPLETED`.

---

## 9. Báo cáo (menu: **Báo cáo** `/reports`) — chỉ xem

- Dashboard: doanh thu, đơn hàng, sản phẩm bán chạy.
- Báo cáo: bán hàng, cuối ngày, tồn kho, khách hàng — **xem + in + xuất Excel** (ADMIN/MANAGER + một phần SALES/WAREHOUSE theo quyền).

---

## 10. Tài khoản & Cài đặt (menu: **Tài khoản** `/accounts`, **Cài đặt** `/settings`)

- **Tài khoản** (chỉ ADMIN): thêm/sửa tài khoản, đặt vai trò (Admin/Bán hàng/Kho/Quản lý), mật khẩu ≥ 6 ký tự, bật/tắt tài khoản. **Không xóa được tài khoản admin gốc; không tự ý tắt tài khoản đang dùng.**
- **Cài đặt** (chỉ ADMIN): hotline, Zalo, email hỗ trợ hiển thị trên header (mọi vai trò đọc được).
- Đổi mật khẩu cá nhân: menu góc phải ⇢ **Đổi mật khẩu**.

---

## 11. Bảng tóm tắt quy tắc nghiệp vụ quan trọng

| # | Quy tắc | Vì sao/cách xử lý |
|---|---|---|
| 1 | **Giá vốn = đơn giá nhập mới nhất** | Khi nhập kho, `Giá vốn` ghi đè = giá nhập đợt gần nhất (không tính bình quân). Nhập giá chính xác ở bước tạo đơn. |
| 2 | **Tồn kho tăng chỉ khi "Đã nhập kho"** | "Chờ duyệt"/"Đã duyệt" chưa tác động tồn kho. |
| 3 | **Duyệt → mới nhập kho** | Nhảy thẳng PENDING→RECEIVED bị chặn. |
| 4 | **Nhập kho lặp = không đổi** | RECEIVED lặp lại an toàn, không cộng dồn tồn. |
| 5 | **Đơn đã nhập kho không hủy được** | Muốn bỏ thì chỉ hủy khi còn Chờ duyệt/Đã duyệt. |
| 6 | **NCC đã có đơn nhập thì không xóa** | Bật/Tắt trạng thái thay vì xóa. |
| 7 | **NCC "Tắt" thì không lập đơn nhập** | Bật lại NCC trước khi nhập. |
| 8 | **SKU & Mã vạch phải duy nhất** | Trùng sẽ bị chặn khi thêm/sửa/import. |
| 9 | **Mã vạch không bắt buộc** | Bỏ trống để `—`; dùng nút "Tự sinh" cho chuẩn EAN-13; có mã vạch mới quét/pos được và in đủ nhãn. |
| 10 | **Hủy đơn bán hàng → hoàn kho** | Đơn → CANCELLED tự trả lại tồn kho + log `CANCEL`. |
| 11 | **Xóa sản phẩm/danh mục** | Chỉ xóa được khi chưa phát sinh giao dịch; ngược lại hãy **Ẩn**. |

---

## 12. Quy trình nhập liệu gợi ý cho ngày đầu triển khai

1. Đăng nhập `admin`.
2. **Danh mục**: tạo đủ danh mục hàng hóa.
3. **Sản phẩm**: khai báo sản phẩm (thủ công hoặc Import Excel) + bấm "Tự sinh" mã vạch.
4. **Nhà cung cấp**: khai các NCC thực tế.
5. **Đơn nhập hàng**: tạo → duyệt → nhập kho; sau đó kiểm tra tồn kho tăng ở trang **Sản phẩm** (cột "Tồn kho", tag màu: đỏ = hết, cam = < 10, xanh = đủ).
6. **Khách hàng** + bắt đầu **bán hàng (POS)**.

> Mẹo: sau mỗi bước nhập, mở **Lịch sử tồn kho** của sản phẩm để tự kiểm tra số liệu
> (`IMPORT` = nhập hàng, `EXPORT` = bán, `ADJUST` = sửa tay, `CANCEL` = hủy đơn).
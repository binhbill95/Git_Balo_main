import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HASH_ROUNDS = 10;

const categories = [
  { name: "Balo học sinh", slug: "balo-hoc-sinh", description: "Balo dành cho học sinh các cấp, nhiều ngăn tiện lợi." },
  { name: "Balo laptop", slug: "balo-laptop", description: "Balo chuyên đựng laptop, chống sốc, chống nước." },
  { name: "Balo du lịch", slug: "balo-du-lich", description: "Balo cỡ lớn dành cho đi phượt, du lịch dài ngày." },
  { name: "Túi xách nữ", slug: "tui-xach-nu", description: "Túi xách thời trang dành cho nữ." },
  { name: "Túi đeo chéo", slug: "tui-deo-cheo", description: "Túi đeo chéo phong cách, nhỏ gọn." },
  { name: "Ví da", slug: "vi-da", description: "Ví da nam/nữ cao cấp." },
];

const products = [
  // Balo học sinh
  { name: "Balo học sinh họa tiết siêu nhân 35L", price: 289000, stock: 45, color: "Xanh dương" },
  { name: "Balo học sinh mẫu công chúa ELSA 30L", price: 265000, stock: 30, color: "Hồng" },
  { name: "Balo học sinh chống gù 25L bé trai", price: 320000, stock: 50, color: "Xanh lá" },
  { name: "Balo học sinh họa tiết ô tô 25L", price: 250000, stock: 40, color: "Đỏ" },
  { name: "Balo học sinh hai ngăn siêu nhẹ 20L", price: 230000, stock: 60, color: "Vàng" },
  // Balo laptop
  { name: "Balo laptop chống sốc 15.6 inch", price: 450000, stock: 35, color: "Đen" },
  { name: "Balo laptop cao cấp da xi 14 inch", price: 620000, stock: 20, color: "Nâu" },
  { name: "Balo laptop chống nước 13 inch", price: 390000, stock: 55, color: "Xám" },
  { name: "Balo laptop có ngăn sạc ngoài 15.6 inch", price: 520000, stock: 25, color: "Đen" },
  { name: "Balo laptop nam văn phòng 15.6 inch", price: 580000, stock: 18, color: "Navy" },
  // Balo du lịch
  { name: "Balo du lịch 40L chống nước", price: 650000, stock: 28, color: "Cam" },
  { name: "Balo leo núi 50L dây đai bền", price: 890000, stock: 15, color: "Xanh rêu" },
  { name: "Balo du lịch 30L phong cách tối giản", price: 480000, stock: 32, color: "Đen" },
  { name: "Balo đi phượt 45L có mũ chống mưa", price: 720000, stock: 22, color: "Xám" },
  { name: "Balo du lịch ngày 20L nhẹ", price: 360000, stock: 40, color: "Xanh dương" },
  // Túi xách nữ
  { name: "Túi xách nữ da bò cao cấp", price: 780000, stock: 12, color: "Đen" },
  { name: "Túi xách nữ công sở đeo vai", price: 690000, stock: 18, color: "Be" },
  { name: "Túi xách nữ mini phong cách", price: 450000, stock: 30, color: "Hồng" },
  { name: "Túi xách nữ quai dây thắt", price: 520000, stock: 24, color: "Trắng" },
  { name: "Túi xách nữ dáng hộp cứng", price: 830000, stock: 10, color: "Đen" },
  // Túi đeo chéo
  { name: "Túi đeo chéo nam da PU", price: 320000, stock: 38, color: "Đen" },
  { name: "Túi đeo chéo nữ mini thời trang", price: 290000, stock: 42, color: "Xanh denim" },
  { name: "Túi đeo chéo chống nước 10L", price: 350000, stock: 25, color: "Xám" },
  { name: "Túi đeo chéo vải canvas bụi phủi", price: 310000, stock: 33, color: "Nâu" },
  { name: "Túi đeo chéo unisex phong cách street", price: 380000, stock: 20, color: "Đen" },
  // Ví da
  { name: "Ví da bò nam mini 8 thẻ", price: 260000, stock: 48, color: "Nâu" },
  { name: "Ví da lộc dài 12 thẻ", price: 350000, stock: 26, color: "Đen" },
  { name: "Ví da nữ cầm tay phối khóa", price: 390000, stock: 16, color: "Hồng" },
  { name: "Ví da nam gập đôi cao cấp", price: 420000, stock: 21, color: "Nâu" },
  { name: "Ví da unisex siêu mỏng", price: 240000, stock: 50, color: "Xanh navy" },
];

const customers = [
  { fullName: "Nguyễn Văn An", phone: "0901234567", email: "an.nguyen@gmail.com", address: "Số 12 Lê Lợi, Quận 1, TP. HCM", gender: "Male" },
  { fullName: "Trần Thị Bích", phone: "0912345678", email: "bich.tran@gmail.com", address: "Số 25 Nguyễn Huệ, Quận 1, TP. HCM", gender: "Female" },
  { fullName: "Lê Hoàng Công", phone: "0923456789", email: "cong.le@gmail.com", address: "Số 8 Trần Hưng Đạo, Hà Nội", gender: "Male" },
  { fullName: "Phạm Thu Dung", phone: "0934567890", email: "dung.pham@gmail.com", address: "Số 45 Hai Bà Trưng, Đà Nẵng", gender: "Female" },
  { fullName: "Võ Minh Đức", phone: "0945678901", email: "duc.vo@gmail.com", address: "Số 10 Lý Tự Trọng, Cần Thơ", gender: "Male" },
  { fullName: "Ngô Thị Hồng", phone: "0956789012", email: "hong.ngo@gmail.com", address: "Số 33 Phạm Ngũ Lão, Huế", gender: "Female" },
  { fullName: "Đặng Quốc Huy", phone: "0967890123", email: "huy.dang@gmail.com", address: "Số 7 Bến Nghé, Quận 1, TP. HCM", gender: "Male" },
  { fullName: "Bùi Lan Phương", phone: "0978901234", email: "phuong.bui@gmail.com", address: "Số 20 Hàng Bông, Hà Nội", gender: "Female" },
  { fullName: "Hồ Văn Nam", phone: "0989012345", email: "nam.ho@gmail.com", address: "Số 56 Nguyễn Đình Chiểu, Đà Lạt", gender: "Male" },
  { fullName: "Dương Thu Trang", phone: "0990123456", email: "trang.duong@gmail.com", address: "Số 14 Xô Viết Nghệ Tĩnh, Đà Nẵng", gender: "Female" },
  { fullName: "Mai Văn Sơn", phone: "0905678123", email: "son.mai@gmail.com", address: "Số 90 Nguyễn Trãi, Thanh Xuân, Hà Nội", gender: "Male" },
  { fullName: "Lý Thúy Vân", phone: "0916789234", email: "van.ly@gmail.com", address: "Số 3 Pasteur, Quận 3, TP. HCM", gender: "Female" },
  { fullName: "Đỗ Trường Giang", phone: "0927890345", email: "giang.do@gmail.com", address: "Số 78 Trần Phú, Hà Đông, Hà Nội", gender: "Male" },
  { fullName: "Chu Ngọc Ánh", phone: "0938901456", email: "anh.chu@gmail.com", address: "Số 15 Lê Duẩn, Vinh, Nghệ An", gender: "Female" },
  { fullName: "Nguyễn Bá Khánh", phone: "0949012567", email: "khanh.nguyen@gmail.com", address: "Số 66 Cách Mạng Tháng 8, TP. HCM", gender: "Male" },
];

const accounts = [
  { username: "admin", password: "admin123", fullName: "Quản trị hệ thống", role: "ADMIN", email: "admin@balostore.vn" },
  { username: "sales", password: "sales123", fullName: "Nguyễn Thu Ngân", role: "SALES", email: "sales@balostore.vn" },
  { username: "warehouse", password: "warehouse123", fullName: "Trần Văn Kho", role: "WAREHOUSE", email: "warehouse@balostore.vn" },
  { username: "manager", password: "manager123", fullName: "Lê Minh Quản", role: "MANAGER", email: "manager@balostore.vn" },
];

const STATUS_FLOW = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

const deliveryPartners = [
  { code: "GHN", name: "Giao hàng nhanh", phone: "1900636978", website: "https://ghn.vn" },
  { code: "GHTK", name: "Giao hàng tiết kiệm", phone: "19006121", website: "https://ghtk.vn" },
  { code: "VT.P", name: "Viettel Post", phone: "19008195", website: "https://viettelpost.vn" },
  { code: "SEXPRESS", name: "Shopee Express", phone: "19001222", website: "https://shopee.vn" },
  { code: "JTEXPRESS", name: "J&T Express", phone: "19001099", website: "https://jtexpress.vn" },
];

const suppliers = [
  { code: "NCC001", name: "Công ty TNHH Sản xuất Balo Việt", phone: "02832145678", email: "sale@baloviet.vn", address: "KCN Sóng Thần, Bình Dương", taxCode: "0312345678", note: "Nhà cung cấp balo, túi xách chính" },
  { code: "NCC002", name: "Xưởng da Minh Phát", phone: "02838554567", email: "contact@minhphat.vn", address: "Q. Tân Bình, TP. HCM", taxCode: "0318765432", note: "Chuyên ví da, túi da cao cấp" },
  { code: "NCC003", name: "Công ty TNHH Thương mại An Phúc", phone: "02438223456", email: "info@anphuc.com", address: "Hà Đông, Hà Nội", taxCode: "0101234567", note: "Phân phối balo laptop nhập khẩu" },
];

function randomDate(startDaysAgo, endDaysAgo) {
  const now = new Date();
  const start = now.getTime() - startDaysAgo * 24 * 3600 * 1000;
  const end = now.getTime() - endDaysAgo * 24 * 3600 * 1000;
  return new Date(start + Math.random() * (end - start));
}

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  // Reset (xoá theo thứ tự FK)
  console.log("🧹 Xóa dữ liệu cũ...");
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.deliveryPartner.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Roles
  console.log("👤 Tạo roles...");
  const roles = [];
  for (const name of ["ADMIN", "SALES", "WAREHOUSE", "MANAGER"]) {
    const role = await prisma.role.create({ data: { name } });
    roles.push(role);
  }
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  // Users
  console.log("👥 Tạo tài khoản demo...");
  const users = [];
  for (const acc of accounts) {
    const user = await prisma.user.create({
      data: {
        username: acc.username,
        password: await bcrypt.hash(acc.password, HASH_ROUNDS),
        fullName: acc.fullName,
        email: acc.email,
        roleId: roleMap[acc.role],
      },
    });
    users.push({ ...user, role: acc.role });
  }

  // Categories
  console.log("📂 Tạo 6 danh mục...");
  const categoryRows = [];
  for (const c of categories) {
    const row = await prisma.category.create({ data: c });
    categoryRows.push(row);
  }

  // Delivery partners (5)
  console.log("🚚 Tạo 5 đối tác giao hàng...");
  const deliveryPartnerRows = [];
  for (const dp of deliveryPartners) {
    const row = await prisma.deliveryPartner.create({
      data: {
        code: dp.code,
        name: dp.name,
        phone: dp.phone,
        website: dp.website,
      },
    });
    deliveryPartnerRows.push(row);
  }

  // Suppliers (3 nhà cung cấp mẫu)
  console.log("🏭 Tạo 3 nhà cung cấp...");
  const supplierRows = [];
  for (const s of suppliers) {
    const row = await prisma.supplier.create({ data: s });
    supplierRows.push(row);
  }

  // Products (30)
  console.log("🎒 Tạo 30 sản phẩm...");
  const productRows = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const categoryIndex = Math.floor(i / 5); // mỗi nhóm 5 sp thuộc 1 category
    const pdb = await prisma.product.create({
      data: {
        name: p.name,
        sku: `SKU${String(i + 1).padStart(3, "0")}`,
        slug: p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-"),
        description: `Sản phẩm ${p.name} chất lượng cao, đúng mô tả, kèm bảo hành 6 tháng.`,
        price: p.price,
        costPrice: Math.round(p.price * 0.6),
        stock: p.stock,
        color: p.color,
        categoryId: categoryRows[categoryIndex].id,
      },
    });
    productRows.push(pdb);
  }

  // Customers (15)
  console.log("👨‍👩‍👧 Tạo 15 khách hàng...");
  const customerRows = [];
  for (const c of customers) {
    const row = await prisma.customer.create({ data: c });
    customerRows.push(row);
  }

  // Orders (30) + order_items + stock logs
  console.log("📦 Tạo 30 đơn hàng...");
  const salesUsers = users.filter((u) => u.role === "SALES" || u.role === "ADMIN");
  const orderRows = [];

  for (let i = 0; i < 30; i++) {
    const customer = customerRows[randomInt(0, customerRows.length - 1)];
    const salesUser = salesUsers[randomInt(0, salesUsers.length - 1)];
    const status = STATUS_FLOW[randomInt(0, STATUS_FLOW.length - 1)];
    const daysAgo = randomInt(1, 200);

    const numLines = randomInt(1, 4);
    const selected = [...productRows].sort(() => Math.random() - 0.5).slice(0, numLines);

    const createdAt = randomDate(daysAgo, daysAgo + 6);
    let totalAmount = 0;
    const lines = selected.map((prod) => {
      const qty = randomInt(1, 4);
      totalAmount += Number(prod.price) * qty;
      return { product: prod, qty };
    });

    // trừ stock + ghi log như thật
    for (const line of lines) {
      if (status !== "CANCELLED") {
        await prisma.stockLog.create({
          data: {
            productId: line.product.id,
            userId: salesUser.id,
            type: "EXPORT",
            quantity: line.qty,
            before: line.product.stock,
            after: line.product.stock - line.qty,
            note: `Xuất kho đơn hàng #HD0000${i + 1}`,
            createdAt,
          },
        });
      }
    }

    const createdOrder = await prisma.order.create({
      data: {
        orderCode: `HD0000${i + 1}`,
        customerId: customer.id,
        userId: salesUser.id,
        status,
        totalAmount,
        note: `Đơn hàng demo ${i + 1}`,
        createdAt,
        orderItems: {
          create: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.qty,
            price: line.product.price,
          })),
        },
      },
    });
    orderRows.push(createdOrder);
  }

  // Shipments (gắn cho các đơn chưa hủy/chưa hoàn thành)
  console.log("📮 Tạo vận đơn mẫu...");
  const shipmentCandidates = orderRows.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "COMPLETED"
  );
  let shipmentIndex = 0;
  for (const order of shipmentCandidates) {
    shipmentIndex += 1;
    const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
    const partner = deliveryPartnerRows[randomInt(0, deliveryPartnerRows.length - 1)];
    const shippingFee = randomInt(20000, 50000);
    const status =
      order.status === "SHIPPING"
        ? "IN_TRANSIT"
        : order.status === "PENDING"
        ? "PENDING_PICKUP"
        : "PENDING_PICKUP";

    await prisma.shipment.create({
      data: {
        shipmentCode: `VD${String(shipmentIndex).padStart(3, "0")}`,
        orderId: order.id,
        partnerId: partner.id,
        trackingCode: `TK-${String(Math.floor(100000000 + Math.random() * 900000000))}`,
        recipientName: customer.fullName,
        recipientPhone: customer.phone,
        recipientAddress: customer.address,
        shippingFee,
        status,
        note: "Vận đơn giao hàng mẫu",
      },
    });
  }

  // Cài đặt hệ thống mặc định (admin chỉnh trên trang Cài đặt)
  const defaultSettings = [
    { key: "support_hotline", value: "1900 0000" },
    { key: "support_zalo", value: "0900000000" },
    { key: "support_email", value: "hotro@balotuixach.vn" },
  ];
  for (const s of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("✅ Seed hoàn tất!");
  console.log(`   ${roles.length} roles | ${users.length} users | ${categoryRows.length} categories | ${productRows.length} products | ${customerRows.length} customers | ${orderRows.length} orders | ${deliveryPartnerRows.length} delivery partners | ${supplierRows.length} suppliers | ${shipmentIndex} shipments`);
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
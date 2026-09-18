import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

// Smoke test chạy với DB thật (yêu cầu PostgreSQL + container balo_postgres đang chạy)
const API_PREFIX = "/api/v1";
let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}${API_PREFIX}`;
});

after(() => server.close());

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const login = async (username, password) => {
  const { status, json } = await api("POST", "/auth/login", {
    body: { username, password },
  });
  assert.equal(status, 200, `login ${username} should succeed`);
  return json.data.accessToken;
};

const DEMO = [
  ["admin", "admin123"],
  ["sales", "sales123"],
  ["warehouse", "warehouse123"],
  ["manager", "manager123"],
];

test("health check public", async () => {
  const { status } = await api("GET", "/system/health");
  assert.equal(status, 200);
});

test("login works for all 4 roles", async () => {
  for (const [u, p] of DEMO) {
    const token = await login(u, p);
    assert.ok(token, `${u} should receive access token`);
  }
});

test("throwing 401 on wrong password", async () => {
  const { status } = await api("POST", "/auth/login", {
    body: { username: "admin", password: "wrongpass" },
  });
  assert.equal(status, 401);
});

test("disallowed route returns 401 without token", async () => {
  const { status } = await api("GET", "/products");
  assert.equal(status, 401);
});

test("any role can read products", async () => {
  for (const [u, p] of DEMO) {
    const token = await login(u, p);
    const { status } = await api("GET", "/products?limit=5", { token });
    assert.equal(status, 200, `${u} should read products`);
  }
});

test("RBAC: only ADMIN manages users", async () => {
  const salesToken = await login("sales", "sales123");
  assert.equal((await api("GET", "/users", { token: salesToken })).status, 403);
  const managerToken = await login("manager", "manager123");
  assert.equal((await api("GET", "/users", { token: managerToken })).status, 403);
  const adminToken = await login("admin", "admin123");
  assert.equal((await api("GET", "/users", { token: adminToken })).status, 200);
});

test("RBAC: only ADMIN creates categories", async () => {
  const salesToken = await login("sales", "sales123");
  assert.equal(
    (await api("POST", "/categories", { token: salesToken, body: { name: "test-cat" } })).status,
    403
  );
});

test("RBAC: reports for ADMIN/MANAGER/SALES, not WAREHOUSE", async () => {
  const whToken = await login("warehouse", "warehouse123");
  assert.equal((await api("GET", "/reports/dashboard", { token: whToken })).status, 403);
  const salesToken = await login("sales", "sales123");
  assert.equal((await api("GET", "/reports/dashboard", { token: salesToken })).status, 200);
  const mgrToken = await login("manager", "manager123");
  assert.equal((await api("GET", "/reports/dashboard", { token: mgrToken })).status, 200);
});

test("RBAC: stock-logs for ADMIN/WAREHOUSE only", async () => {
  const salesToken = await login("sales", "sales123");
  assert.equal((await api("GET", "/products/stock-logs", { token: salesToken })).status, 403);
  const whToken = await login("warehouse", "warehouse123");
  assert.equal((await api("GET", "/products/stock-logs", { token: whToken })).status, 200);
});

test("reports endpoints work for ADMIN", async () => {
  const token = await login("admin", "admin123");
  assert.equal((await api("GET", "/reports/inventory", { token })).status, 200);
  assert.equal((await api("GET", "/reports/top-products?limit=5", { token })).status, 200);
  assert.equal((await api("GET", "/reports/monthly-revenue", { token })).status, 200);
});

test("refresh token rotation works", async () => {
  const { json } = await api("POST", "/auth/login", {
    body: { username: "admin", password: "admin123" },
  });
  const { refreshToken } = json.data;
  const res = await api("POST", "/auth/refresh", { body: { refreshToken } });
  assert.equal(res.status, 200);
  assert.ok(res.json.data.accessToken);
  // token giả mạo bị từ chối
  const bad = await api("POST", "/auth/refresh", { body: { refreshToken: "fake.token.here" } });
  assert.equal(bad.status, 401);
});

test("shipments & delivery-partners readable by all roles", async () => {
  for (const [u, p] of DEMO) {
    const token = await login(u, p);
    assert.equal((await api("GET", "/shipments?limit=5", { token })).status, 200, `${u} read shipments`);
    assert.equal((await api("GET", "/delivery-partners/all", { token })).status, 200, `${u} read partners`);
  }
});

test("RBAC: only ADMIN writes delivery partners", async () => {
  const salesToken = await login("sales", "sales123");
  assert.equal(
    (await api("POST", "/delivery-partners", { token: salesToken, body: { code: "TEST", name: "Test" } })).status,
    403
  );
  const whToken = await login("warehouse", "warehouse123");
  assert.equal(
    (await api("POST", "/delivery-partners", { token: whToken, body: { code: "TEST", name: "Test" } })).status,
    403
  );
});

test("RBAC: only ADMIN/SALES create shipments", async () => {
  const salesToken = await login("sales", "sales123");
  const salesInvalid = await api("POST", "/shipments", { token: salesToken, body: {} });
  assert.equal(salesInvalid.status, 400, "SALES passes auth, invalid body -> 400 (not 403)");

  const adminToken = await login("admin", "admin123");
  const adminInvalid = await api("POST", "/shipments", { token: adminToken, body: {} });
  assert.equal(adminInvalid.status, 400, "ADMIN passes auth, invalid body -> 400 (not 403)");

  for (const username of ["manager", "warehouse"]) {
    const token = await login(username, `${username}123`);
    const r = await api("POST", "/shipments", { token, body: {} });
    assert.equal(r.status, 403, `${username} should be denied creating shipments`);
    assert.equal(r.json?.message, "Bạn không có quyền thực hiện thao tác này", `${username} 403 message`);
  }
});

test("settings: public readable, ADMIN updates, SALES denied", async () => {
  const admin = await login("admin", "admin123");
  const sales = await login("sales", "sales123");

  const pub = await api("GET", "/settings/public", { token: sales });
  assert.equal(pub.status, 200);
  assert.ok("support_hotline" in (pub.json.data || {}), "public settings should be an object");

  const denied = await api("PUT", "/settings", {
    token: sales,
    body: { settings: { support_hotline: "1800 9999" } },
  });
  assert.equal(denied.status, 403, "SALES cannot update settings");

  const bad = await api("PUT", "/settings", {
    token: admin,
    body: { settings: { foo: "bar" } },
  });
  assert.equal(bad.status, 400, "unknown setting key rejected");

  const orig = pub.json.data;
  const upd = await api("PUT", "/settings", {
    token: admin,
    body: { settings: { support_hotline: "1900 1111" } },
  });
  assert.equal(upd.status, 200);
  assert.equal(upd.json.data.support_hotline, "1900 1111");

  const restored = await api("PUT", "/settings", {
    token: admin,
    body: { settings: { support_hotline: orig.support_hotline } },
  });
  assert.equal(restored.status, 200);
  assert.equal(restored.json.data.support_hotline, orig.support_hotline);
});

test("shipment list filters return sorted results", async () => {
  const token = await login("admin", "admin123");
  const { status, json } = await api("GET", "/shipments?limit=3&status=IN_TRANSIT", { token });
  assert.equal(status, 200);
  const onlyTransit = (json.data || []).every((s) => s.status === "IN_TRANSIT");
  assert.ok(onlyTransit, "should only return IN_TRANSIT shipments");
});

test("barcode: optional field - empty stays null, explicit code works, duplicate rejected", async () => {
  const admin = await login("admin", "admin123");

  const list = await api("GET", "/products?limit=1", { token: admin });
  const first = ((list.json.data || [])[0] || {});
  assert.equal(first.barcode, null, "seeded products should have no auto-generated barcode");

  const uniqueSku = `SKU-BC-${Date.now()}`;
  const created = await api("POST", "/products", {
    token: admin,
    body: { name: "Sản phẩm test barcode", sku: uniqueSku, price: 100000, stock: 5, categoryId: first.categoryId },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  assert.equal(created.json.data?.barcode, null, "empty barcode should stay null (no auto-generate)");

  const realCode = `8935201${String(Date.now()).slice(-6)}`;
  const withCode = await api("POST", "/products", {
    token: admin,
    body: { name: "Sản phẩm có mã vạch", sku: `${uniqueSku}-R`, price: 100000, barcode: realCode, categoryId: first.categoryId },
  });
  assert.equal(withCode.status, 201, JSON.stringify(withCode.json));
  assert.equal(withCode.json.data.barcode, realCode, "explicit barcode should be kept");

  const dup = await api("POST", "/products", {
    token: admin,
    body: { name: "Sản phẩm có mã vạch 2", sku: `${uniqueSku}-R2`, price: 100000, barcode: realCode, categoryId: first.categoryId },
  });
  assert.equal(dup.status, 400, "duplicate barcode should be rejected");

  const posLookup = await api("GET", `/products/by-barcode/${realCode}`, { token: admin });
  assert.equal(posLookup.status, 200);
  assert.equal(posLookup.json.data.id, withCode.json.data.id);

  const search = await api("GET", `/products?search=${realCode.slice(-4)}`, { token: admin });
  assert.ok((search.json.data || []).some((p) => p.id === withCode.json.data.id), "search should match by barcode");

  await api("DELETE", `/products/${created.json.data.id}`, { token: admin });
  await api("DELETE", `/products/${withCode.json.data.id}`, { token: admin });
});

test("suppliers: readable by all roles, write by ADMIN/WAREHOUSE only", async () => {
  for (const [u, p] of DEMO) {
    const token = await login(u, p);
    assert.equal((await api("GET", "/suppliers/all", { token })).status, 200, `${u} can read suppliers`);
  }
  const salesToken = await login("sales", "sales123");
  assert.equal(
    (await api("POST", "/suppliers", { token: salesToken, body: { code: "NCC-X", name: "X" } })).status,
    403,
    "SALES denied create supplier"
  );
  const mgrToken = await login("manager", "manager123");
  assert.equal(
    (await api("POST", "/suppliers", { token: mgrToken, body: { code: "NCC-X", name: "X" } })).status,
    403,
    "MANAGER denied create supplier"
  );
  const whToken = await login("warehouse", "warehouse123");
  const whUnique = `NCC-X-${Date.now().toString().slice(-6)}`;
  const whCreate = await api("POST", "/suppliers", {
    token: whToken,
    body: { code: whUnique, name: "Nhà cung cấp WAREHOUSE" },
  });
  assert.equal(whCreate.status, 201, "WAREHOUSE can create supplier");
  const whDelete = await api("DELETE", `/suppliers/${whCreate.json.data.id}`, { token: whToken });
  assert.equal(whDelete.status, 403, "WAREHOUSE cannot delete supplier");
});

test("supplier CRUD + duplicate code rejected (ADMIN)", async () => {
  const admin = await login("admin", "admin123");
  const code = `NCC-T-${Date.now().toString().slice(-6)}`;
  const created = await api("POST", "/suppliers", {
    token: admin,
    body: { code, name: "Nhà cung cấp test", phone: "0900000123", taxCode: "0100000000" },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  assert.equal(created.json.data.code, code);

  const dup = await api("POST", "/suppliers", { token: admin, body: { code, name: "Tên khác" } });
  assert.equal(dup.status, 400, "duplicate supplier code rejected");

  const updated = await api("PUT", `/suppliers/${created.json.data.id}`, {
    token: admin,
    body: { name: "Nhà cung cấp test 2" },
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.json));
  assert.equal(updated.json.data.name, "Nhà cung cấp test 2");

  const removed = await api("DELETE", `/suppliers/${created.json.data.id}`, { token: admin });
  assert.equal(removed.status, 200, "supplier without POs can be deleted");
});

test("purchase orders: ADMIN/WAREHOUSE write, MANAGER read, SALES denied", async () => {
  const salesToken = await login("sales", "sales123");
  assert.equal((await api("GET", "/purchase-orders", { token: salesToken })).status, 403, "SALES denied read PO");
  assert.equal((await api("POST", "/purchase-orders", { token: salesToken, body: {} })).status, 403, "SALES denied create PO");

  const mgrToken = await login("manager", "manager123");
  assert.equal((await api("GET", "/purchase-orders", { token: mgrToken })).status, 200, "MANAGER can read PO");
  assert.equal((await api("POST", "/purchase-orders", { token: mgrToken, body: {} })).status, 403, "MANAGER denied create PO");

  const whToken = await login("warehouse", "warehouse123");
  assert.equal((await api("GET", "/purchase-orders", { token: whToken })).status, 200, "WAREHOUSE can read PO");
});

test("purchase order flow: create -> approve -> receive imports stock + cost price", async () => {
  const admin = await login("admin", "admin123");

  const supplier = await api("POST", "/suppliers", {
    token: admin,
    body: { code: `NCC-FLOW-${Date.now().toString().slice(-6)}`, name: "NCC flow test" },
  });
  assert.equal(supplier.status, 201, JSON.stringify(supplier.json));

  const products = (await api("GET", "/products?limit=1", { token: admin })).json.data;
  assert.ok(products.length > 0, "need at least one product");
  const productId = products[0].id;
  const stockBefore = Number(products[0].stock);

  const qty = 3;
  const unitPrice = 150000;
  const created = await api("POST", "/purchase-orders", {
    token: admin,
    body: { supplierId: supplier.json.data.id, items: [{ productId, quantity: qty, unitPrice }] },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const po = created.json.data;
  assert.equal(po.status, "PENDING");
  assert.equal(Number(po.totalAmount), qty * unitPrice, "total = qty * unitPrice");

  const skip = await api("PATCH", `/purchase-orders/${po.id}/status`, {
    token: admin,
    body: { status: "RECEIVED" },
  });
  assert.equal(skip.status, 400, "cannot jump PENDING -> RECEIVED directly");

  const approved = await api("PATCH", `/purchase-orders/${po.id}/status`, {
    token: admin,
    body: { status: "APPROVED" },
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.json.data.status, "APPROVED");

  const received = await api("PATCH", `/purchase-orders/${po.id}/status`, {
    token: admin,
    body: { status: "RECEIVED" },
  });
  assert.equal(received.status, 200, JSON.stringify(received.json));
  assert.equal(received.json.data.status, "RECEIVED");
  assert.ok(received.json.data.receivedAt, "receivedAt is set after receive");

  const after = (await api("GET", `/products/${productId}`, { token: admin })).json.data;
  assert.equal(Number(after.stock), stockBefore + qty, "stock increased by qty on receive");
  assert.equal(Number(after.costPrice), unitPrice, "costPrice updated to receive unitPrice");

  const logs = (
    await api("GET", `/products/stock-logs?productId=${productId}&limit=5`, { token: admin })
  ).json.data;
  const importLog = (logs || []).find(
    (l) => l.type === "IMPORT" && l.quantity === qty && l.after === stockBefore + qty
  );
  assert.ok(importLog, "stock log IMPORT created on receive");

  const again = await api("PATCH", `/purchase-orders/${po.id}/status`, {
    token: admin,
    body: { status: "RECEIVED" },
  });
  assert.equal(again.status, 200, "repeated RECEIVED is a no-op");
  const after2 = (await api("GET", `/products/${productId}`, { token: admin })).json.data;
  assert.equal(Number(after2.stock), stockBefore + qty, "no double import on repeated RECEIVED");

  const cancelAfterReceive = await api("PATCH", `/purchase-orders/${po.id}/status`, {
    token: admin,
    body: { status: "CANCELLED" },
  });
  assert.equal(cancelAfterReceive.status, 400, "cannot cancel a received PO");
});
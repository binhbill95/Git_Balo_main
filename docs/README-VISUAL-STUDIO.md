# Huong dan chay du an voi Visual Studio 2026

> Du an **Balo - Tui xach** dung Node.js/Express + React. Visual Studio 2026 ho tro tot neu da cai day du cac thanh phan can thiet.

---

## 1. Yeu cau cai san truoc

| Phan mem | Yeu cau | Kiem tra |
|---|---|---|
| Visual Studio 2026 | Phien ban moi nhat | Menu `Help > About` |
| workload **Node.js development** | Bat buoc | `Visual Studio Installer > Modify` |
| Docker Desktop | Dang chay | `docker ps` trong terminal |
| Node.js >= 18 | Node + npm | `node -v`, `npm -v` |

### Cai workload Node.js

1. Mo **Visual Studio Installer**
2. Chon **Modify** tren Visual Studio 2026
3. Tab **Workloads** > tick **Node.js development**
4. Nhan **Modify** de cai

---

## 2. Mo du an

### Cach 1: Mo thu muc cha (khuyen nghi)

1. Mo **Visual Studio 2026**
2. `File > Open > Folder` > chon `C:\path\to\balo-tui-store`
3. VS2026 se tu dong nhan `backend/` va `frontend/` nhu 2 thu muc con

### Cach 2: Mo tung phan rieng

1. `File > Open > Project/Solution` > chon `backend\package.json` (neu co ho tro) hoac `File > Open > Folder` > `backend/`
2. Lam tuong voi `frontend/`

> **Luu y:** Visual Studio 2026 khong co "solution file" cho Node.js. Mo thu muc cha la tot nhat.

---

## 3. Mo Terminal trong VS2026

1. Menu `View > Terminal` (hoac phim tat `Ctrl + \``)
2. Terminal mac dinh la **PowerShell**
3. Neu can them terminal moi: nnut `+` tren thanh terminal

---

## 4. Khoi dong Database (Docker)

Trong **Terminal 1** cua VS2026:

```powershell
cd C:\path\to\balo-tui-store
docker compose up -d db
```

Kiem tra container da chay:

```powershell
docker ps
```

Thanh cong khi thay dong `balo_postgres ... Up ... (healthy)`.

---

## 5. Cai dependencies va chay Backend

### Lan dau tien

```powershell
cd C:\path\to\balo-tui-store\backend
npm install
npm run prisma:migrate
npm run seed
```

### Chay server

```powershell
npm run dev
```

Thanh cong khi thay log `listening on 3000`.

**Kiem tra:** Mo trinh duyet vao `http://localhost:3000/api/v1/system/health` — tra ve `{ status: "ok" }`.

---

## 6. Cai dependencies va chay Frontend

Mo **Terminal moi** (nhan `+` tren thanh terminal):

```powershell
cd C:\path\to\balo-tui-store\frontend
npm install
npm run dev
```

Thanh cong khi thay log `Local: http://localhost:5173/`.

**Kiem tra:** Mo trinh duyet vao `http://localhost:5173` — hien trang dang nhap.

---

## 7. Dang nhap tai khoan demo

| Vai tro | Username | Password |
|---|---|---|
| Quan tri | `admin` | `admin123` |
| Nhan vien ban hang | `sales` | `sales123` |
| Nhan vien kho | `warehouse` | `warehouse123` |
| Quan ly | `manager` | `manager123` |

---

## 8. Su dung Visual Studio 2026 de debug

### Debug Backend (Node.js)

1. Mo `backend/src/server.js` trong editor
2. Dat **breakpoint** bang cach click vao so dong (ben trai)
3. **Debug > Start Debugging** (F5) hoac tao file `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend Dev",
      "runtimeExecutable": "${workspaceFolder}/backend/node_modules/.bin/nodemon",
      "args": ["src/server.js"],
      "cwd": "${workspaceFolder}/backend",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

> **Luu y:** Neu VS2026 khong ho tro "type: node" thi can cai extension **Node.js Tools** hoac dung **VS Code** cho debug Node.js tot hon.

### Debug Frontend (Browser)

1. Chay `npm run dev` trong terminal
2. Mo trinh duyet vao `http://localhost:5173`
3. Nhan **F12** > tab **Sources** de debug tren trinh duyet
4. Hoac su dung extension **Debugger for Chrome** / **Edge DevTools** trong VS2026

---

## 9. Cau hinh Debug cho VS2026 (`.vscode/launch.json`)

Tao file `.vscode/launch.json` tai thu muc goc du an:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend Dev (nodemon)",
      "runtimeExecutable": "${workspaceFolder}/backend/node_modules/.bin/nodemon",
      "args": ["src/server.js"],
      "cwd": "${workspaceFolder}/backend",
      "restart": true,
      "console": "integratedTerminal",
      "envFile": "${workspaceFolder}/backend/.env"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Backend Seed",
      "program": "${workspaceFolder}/backend/node_modules/.bin/prisma",
      "args": ["db", "seed"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

---

## 10. Debugger cho Frontend trong VS2026

### Cach 1: Su dung Edge/Chrome DevTools (de nhat)

1. Chay `npm run dev` trong terminal
2. Mo **Edge** vao `http://localhost:5173`
3. F12 > **Sources** > chon file > dat breakpoint

### Cach 2: Launch URL tu VS2026

Them vao `.vscode/launch.json`:

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Frontend (Chrome)",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/frontend/src"
}
```

> Can cai extension **Debugger for Chrome** hoac **Debugger for Microsoft Edge**.

---

## 11. Cau hinh Editor trong VS2026

### Tu dong format khi luu

Tao file `.editorconfig` tai thu muc goc:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.json]
indent_size = 2

[*.{js,jsx}]
indent_size = 2
```

### Goi y VS2026

- **IntelliSense** cho JS/JSX: ho tro co ban khi cai workload Node.js
- **ESLint/Prettier**: can cai extension ben ngoai hoac dung `npm run lint`
- **File Explorer**: xem cau truc `backend/` va `frontend/` tren sidebar

---

## 12. Luong lam viec khi su dung VS2026

### 3 Terminal can thiet

| Terminal | Lenh | Muc dich |
|---|---|---|
| **Terminal 1** | `docker compose up -d db` | PostgreSQL |
| **Terminal 2** | `cd backend && npm run dev` | API server :3000 |
| **Terminal 3** | `cd frontend && npm run dev` | Vite dev :5173 |

### Cach mo nhieu terminal trong VS2026

1. `View > Terminal` de mo terminal panel
2. Nhan `+` de them terminal moi
3. Nhan `dropdown` de chon terminal muon xem
4. Dat ten: click phai > **Rename**

---

## 13. Kiem tra sau khi chay

| Kiem tra | Lenh / URL | Mong doi |
|---|---|---|
| Docker | `docker ps` | `balo_postgres` = healthy |
| Backend health | `http://localhost:3000/api/v1/system/health` | `{ status: "ok" }` |
| Swagger docs | `http://localhost:3000/api-docs` | Trang API docs |
| Frontend | `http://localhost:5173` | Trang dang nhap |
| Login | `admin` / `admin123` | Vao Dashboard |

---

## 14. Goi loi thuong gap

| Loi | Nguyen nhan | Cach sua |
|---|---|---|
| `ECONNREFUSED :5433` | Docker chua chay | `docker compose up -d db` |
| `Cannot find module` | Chua npm install | `cd backend && npm install` |
| `P1001: Can't connect` | Sai DATABASE_URL | Kiem tra `backend/.env` |
| Port 3000 bi chiem | Da co server khac | `npx kill-port 3006` hoac doi port |
| Port 5173 bi chiem | Da co vite khac | Dong terminal cu hoac doi port |
| `prisma/client not found` | Chua generate | `npm run prisma:generate` |
| Blank screen | Backend loi | Kiem tra `http://localhost:3000/api/v1/system/health` |
| `Module not found: @` | Sai import path | Kiem tra lai import trong file |

---

## 15. So sanh: VS2026 vs VS Code cho du an nay

| Tieu chi | Visual Studio 2026 | VS Code |
|---|---|---|
| Node.js support | Co (can workload) | Tot (native) |
| React/JSX support | Co ban | Tot hon (extension) |
| Debug Node.js | Duoc (can cau hinh) | De hon (extension) |
| Debug Frontend | Phuc tap hon | De hon (Chrome extension) |
| Docker integration | Co | Tot (extension) |
| Performance | Nang hon | Nhe hon |
| **Khuyen nghi** | Neu da quen VS | **Phu hop hon cho Node.js/React** |

> **Ghi chu:** Neu gap kho khang voi VS2026 cho Node.js/React, ban co the dung **VS Code** — no duoc thiet ke dac biet cho stack nay va de su dung hon.

---

## 16. Lenh thuong dung (tong hop)

```powershell
# Khoi dong DB
cd C:\path\to\balo-tui-store
docker compose up -d db

# Backend
cd backend
npm install              # cai dependencies
npm run prisma:migrate   # tao/ap migration
npm run prisma:generate  # generate Prisma Client
npm run seed             # seed du lieu mau
npm run dev              # chay server :3000

# Frontend
cd frontend
npm install              # cai dependencies
npm run dev              # chay vite :5173
npm run build            # build production
npm run lint             # kiem tra loi (oxlint)
```

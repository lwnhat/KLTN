# 💎 KLTN Fine Jewelry E-Commerce Platform
> **Khóa Luận Tốt Nghiệp — Hệ Thống Thương Mại Điện Tử Trang Sức Cao Cấp Chuẩn Kiến Trúc Micro-Services / Modular Monolith**

---

## 🌟 Tổng Quan Dự Án

Hệ thống E-Commerce phục vụ ngành hàng trang sức, kim cương & vàng đá quý cao cấp với các tính năng đặc thù:
- **PIM Master-Variant**: Quản lý biến thể trang sức (chất liệu vàng 18K/24K, kích thước ni tay, chứng thư kiểm định GIA/DOJI).
- **Personalized Laser Engraving**: Khắc chữ laser cá nhân hóa trên thân nhẫn/vòng tay.
- **Inventory Hold Engine**: Tạm giữ kho 15 phút chống Overselling qua Redis Key Expiry & Pub/Sub.
- **Bảo Mật Cấp Cao**: Refresh Token Rotation (RTR) với HttpOnly Secure Cookie chống XSS & CSRF, in-memory short-lived Access Token.
- **Đa Cổng Thanh Toán**: Tích hợp VNPay, MoMo và VietQR (NAPAS 247 Dynamic QR Code).
- **Quy Trình Pipeline Vận Hành Back-Office**: Quản lý đơn hàng, bảo hành điện tử, phiếu sửa chữa, voucher và đánh giá.

---

## 🏛️ Kiến Trúc Cây Thư Mục Dự Án

```
KLTN/ (Monorepo)
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD Pipeline Build, Test & Docker Deploy
├── .gitignore                      # Git ignore rule cho toàn bộ monorepo
├── docker-compose.yml              # Multi-container orchestration (DB, Redis, Backend, Storefront, Admin)
├── README.md                       # Tài liệu hướng dẫn dự án
│
├── backend/                        # RESTful API Service (Node.js Express + Knex + PostgreSQL + Redis)
│   ├── src/
│   │   ├── config/                 # Cấu hình Database, Redis, Swagger, Socket.io
│   │   ├── database/
│   │   │   ├── migrations/         # 4 Knex Migrations quản lý Schema toàn hệ thống
│   │   │   └── seeds/              # Seed dữ liệu thực tế mẫu cho 7 module
│   │   ├── modules/                # Kiến trúc Module hóa chuẩn (DDD-lite)
│   │   │   ├── auth/               # Xác thực, HttpOnly Cookie, OTP Email
│   │   │   ├── products/           # PIM Master Products & Catalog
│   │   │   ├── variants/           # Biến thể, bảng ni size, chất liệu vàng
│   │   │   ├── certificates/       # Quản lý giấy chứng nhận GIA/DOJI
│   │   │   ├── cart/ & orders/     # Giỏ hàng & Pipeline đơn hàng
│   │   │   ├── inventory/          # Engine giữ kho Redis 15 phút
│   │   │   ├── payments/           # Xử lý VietQR, VNPay, MoMo
│   │   │   ├── warranties/         # Sổ bảo hành điện tử & Phiếu sửa chữa
│   │   │   ├── vouchers/           # Mã giảm giá, hạn sử dụng & lượt dùng
│   │   │   ├── reviews/            # Đánh giá sản phẩm & kiểm duyệt
│   │   │   └── admin/              # Tổng hợp báo cáo thống kê Dashboard
│   │   └── shared/                 # Middleware, Services & Tiện ích dùng chung
│   │       ├── middleware/         # Auth, RBAC, Rate-limit, Error handling
│   │       ├── services/           # Email (SMTP), VietQR Generator
│   │       └── utils/              # Logger (Winston), ApiError, API Response
│   ├── .env.example                # Mẫu biến môi trường Backend
│   ├── Dockerfile                  # Production Dockerfile
│   └── knexfile.js                 # Cấu hình Knex DB môi trường
│
├── storefront/                     # Customer Storefront (Next.js 14 App Router + TailwindCSS + Zustand)
│   ├── app/                        # Next.js App Router Pages
│   │   ├── page.tsx                # Trang chủ Editorial Campaign
│   │   ├── products/               # Danh mục & Chi tiết sản phẩm ([slug])
│   │   ├── cart/ & checkout/       # Quy trình đặt hàng & thanh toán VietQR/VNPay
│   │   ├── account/                # Đăng nhập, Dashboard, Đơn mua, Wishlist
│   │   ├── warranty/               # Tra cứu bảo hành điện tử công khai
│   │   └── layout.tsx & globals.css
│   ├── components/                 # UI Components
│   │   ├── layout/                 # Header, Footer, Navigation
│   │   ├── product/                # ProductCard, EngravingModal, Gallery
│   │   └── ui/                     # Shared UI Atoms
│   ├── contexts/                   # React Context (ToastProvider, Glassmorphism Toast)
│   ├── lib/                        # In-Memory Token Client & Secure authFetch
│   ├── store/                      # Zustand Store (Giỏ hàng, Khắc chữ)
│   ├── types/                      # TypeScript definitions
│   ├── public/                     # Static Assets & Icons
│   ├── .env.example                # Mẫu biến môi trường Storefront
│   ├── Dockerfile                  # Production Dockerfile (output: standalone)
│   ├── next.config.js              # Next.js Config (Rewrite API, Image domains)
│   └── tailwind.config.js          # Hệ thống Design Tokens & Keyframe Animations
│
└── admin/                          # Back-Office Admin Panel (React 18 + Vite + Ant Design + Recharts)
    ├── src/
    │   ├── components/             # Reusable Admin UI Components
    │   ├── hooks/                  # Custom React Hooks
    │   ├── lib/                    # Admin API Client & Silent Refresh Interceptor
    │   ├── pages/                  # 7 Phân hệ quản trị chức năng
    │   │   ├── Dashboard.tsx       # Báo cáo doanh thu Realtime & Biểu đồ Recharts
    │   │   ├── ProductMasterVariantPage.tsx # Quản lý PIM, biến thể & GIA
    │   │   ├── OrderPipeline.tsx   # Quản lý vòng đời đơn hàng
    │   │   ├── WarrantyManagementPage.tsx   # Quản lý bảo hành & tiếp nhận sửa chữa
    │   │   ├── VoucherManagementPage.tsx    # Quản lý mã giảm giá
    │   │   ├── UserManagementPage.tsx       # Quản lý người dùng & phân quyền RBAC
    │   │   ├── ReviewManagementPage.tsx     # Kiểm duyệt đánh giá khách hàng
    │   │   └── LoginPage.tsx       # Cổng đăng nhập quản trị viên
    │   ├── types/                  # TypeScript Types cho các thực thể Admin
    │   ├── App.tsx                 # Routing & Auth Guard RBAC
    │   └── main.tsx & index.css
    ├── nginx.conf                  # Nginx Config hỗ trợ SPA Routing (try_files)
    ├── .env.example                # Mẫu biến môi trường Admin
    ├── Dockerfile                  # Multi-stage Nginx Dockerfile
    └── vite.config.ts              # Vite Config & Development Proxy
```

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local Development)

### 1. Khởi động Infrastructure (Database & Redis)
```bash
docker compose up -d postgres redis
```

### 2. Khởi động Backend API
```bash
cd backend
npm install
npm run migrate      # Tạo bảng CSDL
npm run seed         # Nạp dữ liệu mẫu thực tế
npm run dev          # Chạy API tại http://localhost:5000 (Swagger: /api-docs)
```

### 3. Khởi động Storefront
```bash
cd ../storefront
npm install
npm run dev          # Chạy Storefront tại http://localhost:3000
```

### 4. Khởi động Admin Panel
```bash
cd ../admin
npm install
npm run dev          # Chạy Admin Panel tại http://localhost:3001
```

---

## 🐳 Triển Khai Production Bằng Docker Compose

```bash
# Tạo các file .env từ .env.example
cp backend/.env.example backend/.env
cp storefront/.env.example storefront/.env
cp admin/.env.example admin/.env

# Build và chạy tất cả 5 containers
docker compose up -d --build
```

# 🍔 BiteSpeed — Multi-Portal Online Food Delivery System

A modern, full-stack, enterprise-grade online food delivery platform built with **React**, **TypeScript**, **Node.js**, **Express**, **Sequelize ORM**, **PostgreSQL**, and **WebSockets**.

BiteSpeed provides a seamless, real-time experience connecting four distinct user roles: **Customers**, **Restaurant Merchants**, **Delivery Riders**, and **Platform Administrators**.

---

## 🌟 Key Features & Portals

### 🛒 1. Customer Portal
- **Location & Zone Selection**: Automatic filtering of restaurants and popular foods based on selected university/city delivery zone.
- **Interactive Food Catalog**: Filter by platform categories (Burgers, Pizza, Asian, Desserts, Beverages), quick search, and price labels.
- **Item Customization Modal**: Real-time selection of food variants (e.g. Regular/Double), optional add-ons (e.g. Extra Cheese), and special requests.
- **Cart & Checkout**: Multi-item cart management, promo code calculation, zone delivery fee auto-calculation, and delivery address selection.
- **Real-Time Live Order Tracking**: Visual order pipeline (Pending → Confirmed → Preparing → Out for Delivery → Delivered) with live rider location map and WebSocket status updates.

### 🏪 2. Merchant (Restaurant) Portal
- **Live Incoming Orders Dashboard**: Audio-assisted notification system for new orders with instant Accept/Reject actions.
- **Menu & Category Management**: Full CRUD for restaurant food items, custom categories, image upload, pricing variants, and add-on groups.
- **Operating Hours & Status**: Toggle restaurant open/close availability and set standard operating hours.
- **Financial Analytics & Payouts**: Real-time sales statistics, revenue charts, order history, and payout withdrawal requests.

### 🚴 3. Rider Portal
- **Available Deliveries Pool**: Browse and accept nearby available orders ready for delivery within assigned zone.
- **Active Route & Map Navigation**: Interactive Leaflet map showing pickup restaurant location and customer delivery coordinates.
- **Status Progression**: Step-by-step order updates (`Arrived at Restaurant`, `Picked Up`, `Delivered`).
- **Earnings & Wallet**: Track daily/weekly delivery earnings, completed trip history, and withdrawal requests.

### 🛡️ 4. Admin Control Center
- **System Metrics Overview**: Platform GMV, total orders, active users, merchant commission breakdown, and daily analytics charts.
- **Merchant & Rider Verification**: Review, approve, suspend, or ban restaurant applications and rider onboarding documents.
- **Zone & Category Control**: Create and manage delivery zones with custom polygon coordinates and platform-wide food categories.
- **Payout Settlement**: Approve and process withdrawal requests from merchants and riders.

---

## 🏗️ System Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │          React 19 + TypeScript          │
                     │    Vite + Tailwind CSS v4 + Zustand     │
                     └────────────────────┬────────────────────┘
                                          │
                                 REST API │ WebSockets (/ws)
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          Node.js + Express API          │
                     │       JWT Auth + Multer + Swagger       │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          PostgreSQL + Sequelize         │
                     └─────────────────────────────────────────┘
```

### Frontend Stack
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI + Custom Design System
- **State Management**: Zustand
- **Routing**: React Router v7 (with automatic `ScrollToTop` restoration)
- **Charts & Maps**: Recharts + Leaflet / React-Leaflet
- **Icons**: Lucide React

### Backend Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize ORM
- **Real-Time**: WebSockets (`ws` library)
- **Authentication**: JWT (JSON Web Tokens) + Google OAuth 2.0
- **Documentation**: Swagger UI (`swagger-ui-express`)
- **File Uploads**: Cloudinary / Local Storage fallback

---

## 🔑 Showcase Demo Accounts

To quickly test all 4 portals without creating new accounts, use the pre-seeded showcase accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `bitespeed@demo.com` | `123456` | Full Platform Control |
| **Customer** | `customer@demo.com` | `123456` | Ordering & Live Tracking |
| **Merchant** | `merchant@demo.com` | `123456` | Restaurant 1 (Burger Legend) |
| **Merchant (Alt)** | `merchant2@demo.com` ... `merchant30@demo.com` | `123456` | Other Seeded Restaurants |
| **Rider** | `rider@demo.com` | `123456` | Active Delivery Fleet |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Running locally or a cloud database URL (Neon / Railway / Supabase)

### 1. One-Click Launcher (Recommended)

Run the root start script to automatically install dependencies and launch both servers:

```bash
chmod +x start.sh
./start.sh
```

This starts:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

---

### 2. Manual Installation & Setup

#### Step A: Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/online_food_delivery
JWT_SECRET=bitespeed_jwt_super_secret_key_2026
JWT_EXPIRE=30d
NODE_ENV=development
```

Run database seeding to generate 30 premium restaurants with menus, categories, zones, and demo users:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

#### Step B: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📁 Repository Structure

```
online_food_delivery_system/
├── backend/                  # Express REST API & WebSocket server
│   ├── src/
│   │   ├── config/           # Database, Env & Swagger configs
│   │   ├── controllers/      # Auth, Food, Order, Admin, Rider controllers
│   │   ├── models/           # Sequelize models & relationships
│   │   ├── routes/           # Express route definitions
│   │   ├── seeddata/         # Database seeding script & mock data
│   │   ├── websocket/        # WebSocket server & event handlers
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # Entry point & HTTP/WS server listener
│   └── README.md
├── frontend/                 # React 19 + Vite frontend web app
│   ├── src/
│   │   ├── components/       # Layouts, Modals, Maps & UI components
│   │   ├── design-system/    # Reusable UI component library & themes
│   │   ├── pages/            # Customer, Admin, Merchant & Rider pages
│   │   ├── store/            # Zustand stores (Auth, Customer, Rider)
│   │   └── App.tsx           # Router & protected route definitions
│   └── README.md
├── start.sh                  # One-touch launch script for dev servers
└── README.md                 # Project master documentation
```

---

## 📝 License

Distributed under the ISC License. See `LICENSE` for more information.

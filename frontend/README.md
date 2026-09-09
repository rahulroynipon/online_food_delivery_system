# 🎨 BiteSpeed Frontend Client Web Application

The frontend client application for **BiteSpeed Online Food Delivery Platform**, built using **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, and **Radix UI**.

It contains four custom-tailored user interfaces within a unified Single Page Application (SPA): **Customer Storefront**, **Merchant Dashboard**, **Rider Portal**, and **Admin Control Panel**.

---

## 🛠️ Technology Stack

- **Core**: React 19 + Vite 8
- **Language**: TypeScript (`v5.x`)
- **Styling**: Tailwind CSS v4 + `@tailwindcss/postcss` + Custom Design System
- **State Management**: Zustand (`v5.0`)
- **Routing**: React Router v7 (`react-router-dom`)
- **Forms**: React Hook Form (`react-hook-form`)
- **HTTP Client**: Axios (`axios`)
- **Real-Time Maps**: Leaflet + `@types/leaflet`
- **Analytics Charts**: Recharts (`v3.10`)
- **Icons**: Lucide React (`lucide-react`)
- **OAuth**: `@react-oauth/google`

---

## 📂 Frontend Directory Structure

```
frontend/
├── src/
│   ├── components/           # Reusable Component Modules
│   │   ├── CustomerLayout.tsx# Main customer header, zone dropdown, cart drawer & footer
│   │   ├── FoodCustomizerModal.tsx # Food variant & add-on selector modal
│   │   └── rider/            # Rider interactive Leaflet map components
│   ├── design-system/        # Core UI Component Library & Theme System
│   │   ├── components/       # Button, Card, Input, Modal, Tabs, Toast, Skeleton
│   │   └── themes/           # Light, Dark, Forest & Brand CSS theme definitions
│   ├── lib/                  # Axios HTTP instance configuration & interceptors
│   ├── pages/                # Page Components grouped by Portal
│   │   ├── customer/         # HomePage, RestaurantsPage, RestaurantMenuPage, Cart, Checkout, Tracking
│   │   ├── admin/            # Dashboard, Restaurants, Riders, Users, Payouts, Zones, Categories
│   │   ├── restaurant/       # Overview, Menu, Addons, Orders, History, Reviews, Wallet
│   │   ├── rider/            # Overview, Deliveries, History, Wallet, Profile
│   │   ├── Login.tsx         # Universal Login page with showcase account selector
│   │   ├── Signup.tsx        # Customer registration
│   │   ├── NotFoundPage.tsx  # 404 Error page
│   │   └── ...
│   ├── store/                # Zustand Global State Stores
│   │   ├── useAuthStore.ts   # User authentication, tokens & session initialization
│   │   ├── useCustomerStore.ts # Cart items, zone selection & active delivery address
│   │   └── useRiderStore.ts  # Rider live location & active order state
│   ├── App.tsx               # Master route configuration & ScrollToTop handler
│   ├── main.tsx              # Application mount entry point
│   └── index.css             # Tailwind v4 import rules & global styles
├── package.json
└── README.md
```

---

## 💻 Portal Feature Specifications

### 🛒 1. Customer Storefront
- **HomePage (`/`)**: Hero search, platform categories carousel with animated loading skeletons, popular food items grid, and local restaurant cards.
- **Restaurants Page (`/restaurants`)**: Filtering by category, delivery zone, and search query.
- **Restaurant Menu Page (`/restaurant/:slug`)**: Banner header, category jump navigation, food item list, opening hours status, and rating summary.
- **Food Customizer Modal**: Select item variant (e.g. Small / Large) and optional add-ons (e.g. Extra Sauce, Extra Cheese) with real-time price calculation.
- **Cart Page (`/cart`) & Checkout (`/checkout`)**: Multi-item cart management, address selector, payment method choice (Cash on Delivery / Online Card), and order placement.
- **Live Order Tracking (`/order-tracking`)**: Real-time status pipeline with WebSocket updates and live rider GPS location map.

### 🏪 2. Merchant Dashboard (`/restaurant`)
- **Overview Index**: Daily revenue summary, pending orders counter, and sales volume charts.
- **Menu Management (`/restaurant/menu`)**: Create, edit, and toggle availability of food items, size variants, and add-on groups.
- **Live Orders (`/restaurant/orders`)**: Audio notification alerts for new incoming orders with Accept / Prepare / Ready buttons.
- **Financial Wallet (`/restaurant/wallet`)**: Revenue breakdown, commission history, and bank withdrawal requests.

### 🚴 3. Rider Portal (`/rider`)
- **Deliveries Pool (`/rider/deliveries`)**: Available orders ready for delivery within the assigned zone.
- **Live Map Route Navigation**: Interactive Leaflet map displaying pickup restaurant pin, customer drop-off pin, and rider position.
- **Status Stepper**: Transition order state (`Arrived at Restaurant` → `Picked Up` → `Delivered`).
- **Earnings Wallet (`/rider/wallet`)**: Track delivery fees earned per order and total balance.

### 🛡️ 4. Admin Control Center (`/admin`)
- **Analytics Overview**: Platform GMV, order volume, total registered users, and active rider fleet counts.
- **User & Merchant Auditing**: Review and approve newly registered restaurant applications or rider profiles.
- **Zone & Category Settings**: Create delivery zones and platform-wide food categories.

---

## ⚡ Key Architectural Features

1. **Automatic Scroll Restoration (`ScrollToTop`)**: Integrated in `App.tsx` to automatically scroll the window to `(0, 0)` upon every route change or query parameter transition.
2. **Interactive Skeleton Loaders**: Custom pulsing skeleton cards during data fetching for categories, popular foods, and restaurants.
3. **Smart Brand Navigation**: Clicking the BiteSpeed logo across any portal or authentication page seamlessly routes back to the home page (`/`).
4. **Zustand State Persistence**: User sessions, selected delivery zone, and shopping cart contents persist seamlessly across page reloads.

---

## 📜 Available Scripts

- `npm run dev` — Launch Vite dev server at `http://localhost:5173`
- `npm run build` — Compile production build into `dist/`
- `npm run preview` — Locally preview production build
- `npm run format` — Auto-format source files using Prettier
- `npm run lint` — Lint code using `oxlint`

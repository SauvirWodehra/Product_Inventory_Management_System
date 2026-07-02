# SimpleGrid — Purchase Orders & Inventory

> A full-stack ERP feature for managing Purchase Orders and Inventory.  
> Raise POs to vendors, approve them, receive goods, and watch inventory update in real time.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture & Layers](#architecture--layers)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [API Reference](#api-reference)
- [Business Rules](#business-rules)
- [Data Models](#data-models)
- [Testing](#testing)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [AI Tool Usage](#ai-tool-usage)

---

## Tech Stack

| Layer       | Technology                            | Purpose                                |
|-------------|---------------------------------------|----------------------------------------|
| **Runtime** | Node.js 18+                           | Server-side JavaScript runtime         |
| **Backend** | Express.js 4.x                        | REST API framework                     |
| **Frontend**| React 18 + Vite 5                     | UI library + fast build tooling        |
| **Styling** | Tailwind CSS 3.x                      | Utility-first CSS framework            |
| **Routing** | React Router DOM 6.x                  | Client-side page navigation            |
| **Storage** | In-memory (plain arrays/objects)      | No database — server restart wipes data|
| **Testing** | Jest + Supertest                      | Backend API testing                    |
| **API Docs**| Swagger UI (OpenAPI 3.0)              | Interactive API documentation          |
| **Tooling** | Nodemon, PostCSS, Autoprefixer        | Dev server auto-reload, CSS processing |

---

## Project Structure

```
Simple_Grid_Task1/
│
├── backend/                          # ── Express REST API ──────────────
│   ├── package.json                  # Dependencies & scripts
│   ├── src/
│   │   ├── index.js                  # Server entry point (port 3001)
│   │   │
│   │   ├── config/
│   │   │   └── swagger.js            # OpenAPI 3.0 spec & schema definitions
│   │   │
│   │   ├── data/
│   │   │   └── seed.js               # Initial data (5 products, 3 vendors)
│   │   │
│   │   ├── models/
│   │   │   └── store.js              # In-memory data store (CRUD operations)
│   │   │
│   │   ├── services/
│   │   │   └── poService.js          # Business logic (create, approve, receive)
│   │   │
│   │   ├── routes/
│   │   │   ├── products.js           # GET /api/products
│   │   │   ├── vendors.js            # GET /api/vendors
│   │   │   └── purchaseOrders.js     # All PO endpoints (CRUD + state transitions)
│   │   │
│   │   └── middleware/
│   │       └── errorHandler.js       # Global error handler (clean 4xx/5xx JSON)
│   │
│   └── tests/
│       └── po.test.js                # 13 automated test cases
│
├── frontend/                         # ── React + Vite + Tailwind ───────
│   ├── package.json                  # Dependencies & scripts
│   ├── vite.config.js                # Vite config (proxy /api → backend)
│   ├── tailwind.config.js            # Tailwind content scanning config
│   ├── postcss.config.js             # PostCSS plugins
│   ├── index.html                    # Entry HTML (Inter font loaded)
│   └── src/
│       ├── main.jsx                  # React 18 entry (BrowserRouter)
│       ├── App.jsx                   # Root component (routes + toast provider)
│       ├── index.css                 # Tailwind directives + base styles
│       │
│       ├── api/
│       │   └── client.js             # Fetch wrapper (all API calls)
│       │
│       ├── components/
│       │   ├── Navbar.jsx            # Navigation bar with active link state
│       │   ├── Toast.jsx             # Toast notification system (context-based)
│       │   ├── StatusBadge.jsx       # PO status badge (draft/approved/received)
│       │   └── Spinner.jsx           # Loading spinner component
│       │
│       └── pages/
│           ├── InventoryPage.jsx     # Product table with stock indicators
│           └── PurchaseOrdersPage.jsx # PO list + create form + detail modal
│
└── README.md                         # This file
```

---

## Architecture & Layers

The backend follows a **3-layer architecture** for clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│  InventoryPage  │  PurchaseOrdersPage  │  api/client.js        │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP (fetch via Vite proxy)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTES LAYER (Express)                        │
│  routes/products.js  │  routes/vendors.js  │  routes/purchaseOrders.js │
│                                                                 │
│  • Parses HTTP requests (params, query, body)                   │
│  • Delegates to service layer                                   │
│  • Formats HTTP responses (status codes, JSON)                  │
│  • Does NOT contain business logic                              │
└────────────────────────────┬────────────────────────────────────┘
                             │  Function calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (Business Logic)                 │
│                    services/poService.js                         │
│                                                                 │
│  • createPO() — validate inputs, compute total, generate ID     │
│  • approvePO() — enforce draft status, manager approval rule    │
│  • receivePO() — enforce approved status, update inventory      │
│  • Throws typed AppError with statusCode                        │
│  • Does NOT know about HTTP/Express                             │
└────────────────────────────┬────────────────────────────────────┘
                             │  Function calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (In-Memory Store)                  │
│                     models/store.js                              │
│                                                                 │
│  • Plain arrays: products[], vendors[], purchaseOrders[]        │
│  • CRUD functions: get, add, update                             │
│  • resetStore() for test isolation                              │
│  • Could be swapped for a real DB without changing upper layers │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   CROSS-CUTTING CONCERNS                        │
│  middleware/errorHandler.js — catches errors, returns clean JSON│
│  config/swagger.js — OpenAPI 3.0 spec for /api-docs            │
│  data/seed.js — initial product & vendor data                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this matters:** Each layer has a single responsibility. Routes don't enforce business rules. Services don't know about HTTP. The store could be swapped for PostgreSQL/MongoDB without changing the service or route layers.

---

## Features

### Backend
- ✅ RESTful API with 7 endpoints covering the full PO lifecycle
- ✅ In-memory data store (no database, server restart wipes data)
- ✅ Seed data loaded on startup (5 products, 3 vendors)
- ✅ Server-computed PO totals (never trust the client)
- ✅ PO state machine: `draft → approved → received`
- ✅ Double-receive protection (idempotent)
- ✅ Manager approval rule for high-value POs (> $5,000)
- ✅ Clean 4xx error responses with readable messages (never crashes)
- ✅ Global error handling middleware
- ✅ Swagger/OpenAPI interactive documentation
- ✅ 13 automated tests covering all business rules

### Frontend
- ✅ **Inventory Page** — Product table with SKU, live stock levels, color-coded status badges
- ✅ **Purchase Orders Page** — Full PO management with list, create, detail, and actions
- ✅ **Create PO Modal** — Vendor dropdown, dynamic line items (add/remove), computed total preview
- ✅ **PO Detail Modal** — Line items table with line totals, vendor info, action buttons
- ✅ **Approve/Receive** — Inline buttons on list + detail modal
- ✅ **Manager Checkbox** — "Approve as Manager" toggle for POs ≥ $5,000
- ✅ **Toast Notifications** — Success (green) and error (red) with auto-dismiss
- ✅ **Loading States** — Spinner on data fetches, button text changes during actions
- ✅ **Error Handling** — API errors surface as toast messages, never fail silently
- ✅ **Responsive Layout** — Works on desktop and tablet

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** installed
- Two terminal windows (one for backend, one for frontend)

### Installation & Running

#### 1. Clone / Navigate to the project

```bash
cd C:\Users\LOQ\Desktop\Study\Simple_Grid_Task1
```

#### 2. Start the Backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

The server starts at **http://localhost:3001**

#### 3. Start the Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**

> The Vite dev server proxies all `/api/*` requests to the backend, so both servers must be running simultaneously.

#### 4. View API Documentation

Open **http://localhost:3001/api-docs** in your browser for the interactive Swagger UI.

#### 5. Run Automated Tests

```bash
cd backend
npm test
```

---

## API Documentation (Swagger)

Interactive API documentation is available via **Swagger UI** at:

```
http://localhost:3001/api-docs
```

The raw OpenAPI 3.0 JSON spec is available at:

```
http://localhost:3001/api-docs.json
```

Swagger UI lets you:
- Browse all endpoints grouped by tags (Products, Vendors, Purchase Orders)
- See request/response schemas with examples
- **Try out API calls directly** from the browser
- View all possible error responses and status codes

---

## API Reference

### Products

| Method | Endpoint          | Description                    | Response |
|--------|-------------------|--------------------------------|----------|
| `GET`  | `/api/products`   | List all products with stock   | `200` — Array of products |

**Response Example:**
```json
[
  { "id": 1, "name": "Widget A", "sku": "WDG-001", "stock": 100 },
  { "id": 2, "name": "Gear B", "sku": "GER-002", "stock": 75 }
]
```

---

### Vendors

| Method | Endpoint          | Description        | Response |
|--------|-------------------|--------------------|----------|
| `GET`  | `/api/vendors`    | List all vendors   | `200` — Array of vendors |

**Response Example:**
```json
[
  { "id": 1, "name": "Acme Supplies", "email": "contact@acmesupplies.com" }
]
```

---

### Purchase Orders

| Method | Endpoint                                | Description                                      | Response Codes |
|--------|-----------------------------------------|--------------------------------------------------|----------------|
| `GET`  | `/api/purchase-orders`                  | List all POs with status and vendor name         | `200`          |
| `POST` | `/api/purchase-orders`                  | Create a new PO (vendor + line items)            | `201`, `400`, `404` |
| `GET`  | `/api/purchase-orders/:id`              | Get PO details with enriched line items          | `200`, `404`   |
| `POST` | `/api/purchase-orders/:id/approve`      | Move draft PO → approved                        | `200`, `400`, `403`, `404` |
| `POST` | `/api/purchase-orders/:id/receive`      | Receive goods → update inventory                 | `200`, `400`, `404` |

#### POST `/api/purchase-orders` — Create PO

**Request Body:**
```json
{
  "vendorId": 1,
  "lineItems": [
    { "productId": 1, "qty": 50, "unitPrice": 12.50 },
    { "productId": 3, "qty": 100, "unitPrice": 5.00 }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "PO-a1b2c3d4",
  "vendorId": 1,
  "lineItems": [
    { "productId": 1, "qty": 50, "unitPrice": 12.5 },
    { "productId": 3, "qty": 100, "unitPrice": 5.0 }
  ],
  "total": 1125.00,
  "status": "draft",
  "createdAt": "2026-07-02T14:30:00.000Z"
}
```

#### POST `/api/purchase-orders/:id/approve`

**Query Parameters:**

| Param  | Required | Description |
|--------|----------|-------------|
| `role` | Conditional | Set to `manager` for POs with total > $5,000 |

**Example:** `POST /api/purchase-orders/PO-a1b2c3d4/approve?role=manager`

**Error Response (400):**
```json
{
  "error": {
    "message": "Purchase order can only be approved when in draft status. Current status: approved",
    "status": 400
  }
}
```

**Error Response (403 — Manager required):**
```json
{
  "error": {
    "message": "Purchase orders exceeding $5,000 require manager approval. Please use ?role=manager",
    "status": 403
  }
}
```

#### POST `/api/purchase-orders/:id/receive`

**Success Response (200):**
- PO status changes to `received`
- Product stock increases by line item quantities
- Subsequent receive calls return `400` (double-receive protection)

---

## Business Rules

### PO State Machine

```
  ┌───────────┐     approve      ┌───────────┐     receive      ┌───────────┐
  │   DRAFT   │ ───────────────► │  APPROVED │ ───────────────► │  RECEIVED │
  └───────────┘                  └───────────┘                  └───────────┘
       │                              │                              │
       │  Cannot receive             │  Cannot approve again       │  Cannot approve
       │  Cannot skip to received    │  Cannot go back to draft    │  Cannot receive again
       ▼                              ▼                              ▼
     (400)                          (400)                          (400)
```

### Rule Summary

| # | Rule | Enforcement | Error Code |
|---|------|-------------|------------|
| 1 | PO total is computed server-side | `poService.createPO()` calculates `sum(qty × unitPrice)` | — |
| 2 | Only draft POs can be approved | Status check in `poService.approvePO()` | `400` |
| 3 | Only approved POs can be received | Status check in `poService.receivePO()` | `400` |
| 4 | Double-receive prevention | Status is already `received`, fails status check | `400` |
| 5 | Receiving updates inventory | `store.updateProductStock()` called per line item | — |
| 6 | **Bonus:** Manager approval for POs > $5,000 | `?role=manager` query param check | `403` |
| 7 | Invalid operations return clean errors | Global `errorHandler` middleware | `4xx` |

---

## Data Models

### Product
```json
{
  "id": 1,
  "name": "Widget A",
  "sku": "WDG-001",
  "stock": 100
}
```

### Vendor
```json
{
  "id": 1,
  "name": "Acme Supplies",
  "email": "contact@acmesupplies.com"
}
```

### Purchase Order
```json
{
  "id": "PO-a1b2c3d4",
  "vendorId": 1,
  "status": "draft | approved | received",
  "lineItems": [
    { "productId": 1, "qty": 50, "unitPrice": 12.50 }
  ],
  "total": 625.00,
  "createdAt": "2026-07-02T14:30:00.000Z"
}
```

### Error Response
```json
{
  "error": {
    "message": "Human-readable error description",
    "status": 400
  }
}
```

### Seed Data

**Products (5):**

| ID | Name         | SKU     | Initial Stock |
|----|-------------|---------|---------------|
| 1  | Widget A     | WDG-001 | 100           |
| 2  | Gear B       | GER-002 | 75            |
| 3  | Sprocket C   | SPR-003 | 200           |
| 4  | Gasket D     | GSK-004 | 150           |
| 5  | Bolt Pack E  | BLT-005 | 500           |

**Vendors (3):**

| ID | Name              | Email                         |
|----|-------------------|-------------------------------|
| 1  | Acme Supplies     | contact@acmesupplies.com      |
| 2  | Global Parts Co.  | sales@globalparts.com         |
| 3  | Prime Components  | orders@primecomponents.com    |

---

## Testing

### Automated Test Suite

Run tests from the `backend/` directory:

```bash
cd backend
npm test
```

**13 test cases covering:**

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | GET /api/products returns seeded products | 200, 5 products |
| 2 | GET /api/vendors returns seeded vendors | 200, 3 vendors |
| 3 | POST /api/purchase-orders creates PO with computed total | 201, correct total |
| 4 | POST /api/purchase-orders validates required fields | 400, error message |
| 5 | GET /api/purchase-orders/:id returns PO with line items | 200, enriched data |
| 6 | Approve draft PO moves to approved | 200, status = approved |
| 7 | Approve non-draft PO returns error | 400 |
| 8 | Receive approved PO updates stock | 200, stock increased |
| 9 | Receive non-approved PO returns error | 400 |
| 10 | Double receive returns error | 400 |
| 11 | Manager approval: PO > $5000 without role | 403 |
| 12 | Manager approval: PO > $5000 with role=manager | 200 |
| 13 | Non-existent PO returns 404 | 404 |

### Manual Testing

1. Start both servers (see [Getting Started](#getting-started))
2. Open `http://localhost:5173`
3. **Create a PO** → verify it appears in draft status
4. **Approve it** → verify status changes to approved
5. **Receive it** → verify status changes to received, check inventory page for increased stock
6. **Try approving again** → verify error toast appears
7. **Create a high-value PO** (> $5,000) → try approving without manager checkbox → verify 403 error

---

## Design Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| **In-memory storage** | No persistence, but matches spec. Store module interface mirrors a DB adapter for easy swap. |
| **UUID-based PO IDs** | `PO-{uuid}` format avoids auto-increment collisions in distributed systems. |
| **Server-computed totals** | Client shows a preview, but server is the source of truth. Prevents price manipulation. |
| **Vite proxy** | Frontend proxies `/api` to backend, avoiding CORS complexity in development. |
| **Manager approval via query param** | `?role=manager` instead of full auth — keeps scope appropriate for the task while demonstrating the business rule. |
| **Global error handler** | Catches all thrown `AppError` instances and returns consistent JSON. No unhandled crashes. |
| **Toast notifications** | Context-based system provides consistent UX for both success and error states across all pages. |
| **3-layer architecture** | Routes → Services → Store separation makes each layer independently testable and replaceable. |

---

## AI Tool Usage

This project was built with AI assistance (Claude). Here's a transparent breakdown:

### Where AI Helped
- **Scaffolding** — Generated project structure, boilerplate (package.json, Vite config, Tailwind config)
- **Business logic** — Drafted the PO service with state transitions and validation
- **Test suite** — Generated comprehensive test cases covering happy paths and edge cases
- **Frontend components** — Generated React components with Tailwind styling
- **Swagger docs** — Generated OpenAPI spec and route annotations

### Where I Corrected / Reviewed
- **Data model alignment** — Fixed a mismatch between frontend field names (`items`/`quantity`) and backend names (`lineItems`/`qty`)
- **Business rule accuracy** — Verified all state transitions match the spec exactly
- **Error messages** — Ensured error responses are clear and match assignment requirements
- **Edge cases** — Confirmed double-receive protection and manager approval logic work correctly
- **Test coverage** — Validated tests cover the specific scenarios from the assignment brief

The AI served as a productivity multiplier for boilerplate and repetitive code, while design decisions and business rule correctness were carefully validated against the requirements.

---

## License

This project was built as an assignment for SimpleGrid.

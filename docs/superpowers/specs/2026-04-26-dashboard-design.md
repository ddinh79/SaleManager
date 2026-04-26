# Module 3.6 – Dashboard Design Spec

**Date:** 2026-04-26
**Status:** Approved

---

## 1. Overview

**Goal:** Role-based dashboards for CEO, Manager, and Sales to view their specific metrics and KPIs.

**Scope:** Three separate dashboard pages, each with backend API and frontend UI.

---

## 2. Database Design (Existing)

Uses existing data from:
- Deals (stage, probability, total_value)
- Orders (total_amount, status)
- Doctors
- Users
- Activities

No new tables needed.

---

## 3. Backend API

### 3.1 CEO Dashboard

```
GET /api/dashboard/ceo
```

**Response:**
```json
{
  "totalRevenue": 500000000,
  "pipelineValue": 800000000,
  "weightedForecast": 320000000,
  "conversionRate": 35,
  "totalDeals": 100,
  "wonDeals": 35,
  "activeDeals": 65,
  "topDoctors": [
    { "id": "guid", "name": "Dr. Smith", "hospital": "City Hospital", "totalValue": 50000000 }
  ],
  "revenueBySales": [
    { "salesId": "guid", "salesName": "John", "revenue": 50000000, "dealsWon": 5 }
  ]
}
```

**Formulas:**
- `totalRevenue` = SUM(order.totalAmount) WHERE order.status = COMPLETED
- `pipelineValue` = SUM(deal.totalValue) WHERE deal.stage NOT IN (WON, LOST)
- `weightedForecast` = SUM(deal.totalValue * deal.probability / 100) WHERE deal.stage NOT IN (WON, LOST)
- `conversionRate` = (won_deals / total_deals) * 100

### 3.2 Manager Dashboard

```
GET /api/dashboard/manager
```

**Response:**
```json
{
  "teamSize": 5,
  "teamPipelineValue": 200000000,
  "teamWeightedForecast": 80000000,
  "dealsClosingThisMonth": 8,
  "inactiveSalesMembers": [
    { "id": "guid", "name": "Sales1", "lastActivity": "2026-04-20", "daysInactive": 6 }
  ],
  "teamPerformance": [
    { "salesId": "guid", "salesName": "John", "dealsWon": 3, "revenue": 15000000, "tasksCompleted": 10 }
  ]
}
```

**Notes:**
- Shows only team members under this manager
- Inactive = no activity in last 5 days

### 3.3 Sales Dashboard

```
GET /api/dashboard/sales
```

**Response:**
```json
{
  "myDeals": 10,
  "myPipelineValue": 50000000,
  "myWeightedForecast": 20000000,
  "tasksToday": 5,
  "tasksOverdue": 2,
  "kpiProgress": {
    "targetRevenue": 100000000,
    "currentRevenue": 45000000,
    "targetDeals": 20,
    "wonDeals": 9
  },
  "recentActivities": [
    { "id": "guid", "type": "CALL", "doctorName": "Dr. Smith", "createdAt": "2026-04-26T10:00:00Z" }
  ]
}
```

---

## 4. Frontend Design

### 4.1 CEO Dashboard (/dashboard/ceo)

```
┌──────────────────────────────────────────────────────────────┐
│  CEO Dashboard                                                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Revenue     │  Pipeline    │  Conversion  │  Active Deals  │
│  ₮500M      │  ₮800M       │  35%        │  65            │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                                                              │
│  [Revenue Chart - Bar/Line showing monthly revenue]          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Top Doctors Table]          [Revenue by Sales Table]       │
│  - Doctor Name                - Sales Name                   │
│  - Hospital                   - Revenue                       │
│  - Total Value               - Deals Won                     │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Manager Dashboard (/dashboard/manager)

```
┌──────────────────────────────────────────────────────────────┐
│  Manager Dashboard                                           │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Team Size  │  Team Pipe  │  Forecast   │  Closing This  │
│  5          │  ₮200M      │  ₮80M       │  8 deals       │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                                                              │
│  [Team Performance Table]                                    │
│  - Sales Name | Deals Won | Revenue | Tasks                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Inactive Sales Alert]          [Deals Closing Soon]         │
│  - Red alert if inactive > 5    - List of deals closing      │
│    days                          this month                  │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Sales Dashboard (/dashboard/sales)

```
┌──────────────────────────────────────────────────────────────┐
│  My Dashboard                                                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  My Deals    │  My Pipeline│  Tasks Today│  KPI Progress  │
│  10          │  ₮50M        │  5           │  45%           │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                                                              │
│  [My Tasks Today]           [KPI Progress Bar]               │
│  - Task 1                  Target: ₮100M                    │
│  - Task 2                  Current: ₮45M (45%)              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Recent Activities]                                         │
│  - Activity log with doctor, type, time                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Tasks

### Backend
1. Create `DashboardDtos.cs` with CEO/Manager/Sales response DTOs
2. Create `IDashboardService.cs` + `DashboardService.cs`
3. Create `DashboardController.cs` with 3 endpoints
4. Register DashboardService in DI

### Frontend
1. Create `dashboardService.ts` with API methods
2. Create `CEODashboard.tsx` page
3. Create `ManagerDashboard.tsx` page
4. Create `SalesDashboard.tsx` page
5. Add routes to App.tsx
6. Update menu items (CEO, Manager views require Admin role)
7. Connect existing Dashboard.tsx to real data or redirect based on role

---

## 6. API Response Codes

| Endpoint | Success | Errors |
|----------|---------|--------|
| GET /api/dashboard/ceo | 200 | - |
| GET /api/dashboard/manager | 200 | - |
| GET /api/dashboard/sales | 200 | - |
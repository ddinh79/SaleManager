# Module 3.5 – Order Management Design Spec

**Date:** 2026-04-26
**Status:** Approved

---

## 1. Overview

**Goal:** Manage actual orders created from won deals, track order status flow from pending approval to completion.

**Scope:** Auto-create orders when deal wins, order status transitions, manager approval workflow.

---

## 2. Database Design

### 2.1 Order Entity

File: `backend/Entities/Order.cs`

| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | Primary key |
| DealId | Guid | FK to Deal |
| DoctorId | Guid | FK to Doctor |
| Product | ProductType | SILICONE or CREAM |
| Quantity | int | From deal |
| Price | decimal | From deal's unit_price |
| TotalAmount | decimal | Computed: Quantity × Price |
| Status | OrderStatus | Current status |
| CreatedAt | DateTime | Auto-set |
| UpdatedAt | DateTime | Auto-set on update |

### 2.2 OrderStatus Enum

File: `backend/Entities/Enums.cs`

```csharp
public enum OrderStatus
{
    PENDING_APPROVAL,
    APPROVED,
    READY_TO_SHIP,
    SHIPPED,
    COMPLETED
}
```

**Note:** Existing OrderStatus (Pending, Shipped, Completed) replaced with new values.

---

## 3. Auto-Create Rule

### When Deal Becomes WON

When `deal.Stage` transitions to `WON`:
```
1. Create new Order entity
2. Copy from Deal:
   - DealId = deal.Id
   - DoctorId = deal.DoctorId
   - Product = deal.Product
   - Quantity = deal.Quantity
   - Price = deal.UnitPrice
   - TotalAmount = deal.TotalValue
3. Set Status = PENDING_APPROVAL
4. Save order
```

**Implementation:** In `DealService.UpdateStageAsync`, when newStage == WON, create and save order before returning.

---

## 4. Business Rules

### Rule 1: Order Immutability
```
Orders cannot be edited or deleted after creation.
Orders can only have their status updated through defined transitions.
```

### Rule 2: Status Transitions
```
PENDING_APPROVAL → APPROVED (by Manager only)
APPROVED → READY_TO_SHIP (by Manager only)
READY_TO_SHIP → SHIPPED (by Manager only)
SHIPPED → COMPLETED (by Manager only)
```

### Rule 3: Role-Based Actions
```
Only Admin or SalesManager can approve/ship/complete orders.
SalesMember can view orders but cannot change status.
```

---

## 5. Backend API

### 5.1 Get Orders
```
GET /api/orders
GET /api/orders?status=PENDING_APPROVAL (filter by status)
GET /api/orders?doctorId={guid} (filter by doctor)
```

**Response:**
```json
{
  "items": [
    {
      "id": "guid",
      "dealId": "guid",
      "doctorId": "guid",
      "doctorName": "Dr. Smith",
      "product": "SILICONE",
      "quantity": 100,
      "price": 150000,
      "totalAmount": 15000000,
      "status": "PENDING_APPROVAL",
      "createdAt": "2026-04-26T10:00:00Z"
    }
  ],
  "totalCount": 5
}
```

### 5.2 Approve Order
```
POST /api/orders/{id}/approve
```
**Precondition:** Order status = PENDING_APPROVAL
**Postcondition:** Order status = APPROVED
**Error:** 400 if not PENDING_APPROVAL, 404 if not found

### 5.3 Mark Ready to Ship
```
POST /api/orders/{id}/ready
```
**Precondition:** Order status = APPROVED
**Postcondition:** Order status = READY_TO_SHIP

### 5.4 Ship Order
```
POST /api/orders/{id}/ship
```
**Precondition:** Order status = READY_TO_SHIP
**Postcondition:** Order status = SHIPPED

### 5.5 Complete Order
```
POST /api/orders/{id}/complete
```
**Precondition:** Order status = SHIPPED
**Postcondition:** Order status = COMPLETED

---

## 6. Frontend Design

### 6.1 Orders Page (Table UI)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Orders                                           [Filter: All ▼]          │
├─────────────┬──────────────┬────────────┬─────────────┬────────────────────┤
│ ORDER       │ DOCTOR       │ VALUE      │ STATUS      │ ACTIONS            │
├─────────────┼──────────────┼────────────┼─────────────┼────────────────────┤
│ #ORD-001    │ Dr. Nguyen   │ 15,000,000 │ 🟡 Pending  │ [Approve]           │
│ Apr 26      │ Van A       │ VND        │             │                    │
├─────────────┼──────────────┼────────────┼─────────────┼────────────────────┤
│ #ORD-002    │ Dr. Trần    │ 8,500,000  │ 🔵 Approved │ [Ready to Ship]    │
│ Apr 25      │ Văn B       │ VND        │             │                    │
├─────────────┼──────────────┼────────────┼─────────────┼────────────────────┤
│ #ORD-003    │ Dr. Lê      │ 12,000,000 │ 🟠 Shipping │ [Complete]          │
│ Apr 24      │ Thị C       │ VND        │             │                    │
└─────────────┴──────────────┴────────────┴─────────────┴────────────────────┘
```

### 6.2 Status Badge Colors

| Status | Color | Badge |
|--------|-------|-------|
| PENDING_APPROVAL | Gray | `bg-gray-100 text-gray-700` |
| APPROVED | Blue | `bg-blue-100 text-blue-700` |
| READY_TO_SHIP | Orange | `bg-orange-100 text-orange-700` |
| SHIPPED | Purple | `bg-purple-100 text-purple-700` |
| COMPLETED | Green | `bg-green-100 text-green-700` |

### 6.3 Actions

Buttons shown based on current status + user role:

| Status | Actions Available |
|--------|-----------------|
| PENDING_APPROVAL | Approve button (Manager/Admin) |
| APPROVED | Ready to Ship button (Manager/Admin) |
| READY_TO_SHIP | Ship button (Manager/Admin) |
| SHIPPED | Complete button (Manager/Admin) |
| COMPLETED | None |

---

## 7. Implementation Tasks

### Backend
1. Update `OrderStatus` enum in `Enums.cs` (replace existing)
2. Update `Order` entity field names to match spec (TotalAmount instead of TotalValue)
3. Create `IOrderRepository` + `OrderRepository`
4. Create `IOrderService` + `OrderService`
5. Create `OrdersController` with all endpoints
6. Modify `DealService.UpdateStageAsync` to auto-create order when deal → WON
7. Register Order service/repository in DI
8. Update database (recreate)

### Frontend
1. Add Order types to `types/index.ts`
2. Create `orderService.ts`
3. Create `Orders.tsx` page with table UI
4. Add Orders route to `App.tsx`
5. Add Orders menu item to `menuConfig.tsx`

---

## 8. API Response Codes

| Endpoint | Success | Errors |
|----------|---------|--------|
| GET /orders | 200 + list | - |
| POST /orders/{id}/approve | 200 | 400 wrong status, 404 |
| POST /orders/{id}/ready | 200 | 400 wrong status, 404 |
| POST /orders/{id}/ship | 200 | 400 wrong status, 404 |
| POST /orders/{id}/complete | 200 | 400 wrong status, 404 |
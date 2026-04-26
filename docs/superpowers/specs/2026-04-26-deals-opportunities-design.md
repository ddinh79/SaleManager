# Module 3.4 – Deals / Opportunities Design Spec

**Date:** 2026-04-26
**Status:** Approved

---

## 1. Overview

**Goal:** Manage sales pipeline, predict future revenue, track deal progress per doctor.

**Scope:** Kanban board for deals, deal CRUD, stage transitions, locked deal rules, team-based visibility, pipeline forecast widget.

---

## 2. Database Design

### 2.1 Deal Entity

File: `backend/Entities/Deal.cs`

| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | Primary key |
| DoctorId | Guid | FK to Doctor |
| SalesId | Guid | FK to User (owner) |
| Product | ProductType | Enum: SILICONE, CREAM |
| Quantity | int | Required, > 0 |
| UnitPrice | decimal | Required, > 0 |
| TotalValue | decimal | Computed: Quantity × UnitPrice |
| Stage | DealStage | NEW, IN_PROGRESS, NEGOTIATION, WON, LOST |
| Probability | int | 10/40/70 based on stage (auto-set, not editable) |
| ExpectedCloseDate | DateTime | Optional |
| Notes | string? | Max 1000 chars |
| CreatedAt | DateTime | Auto-set |
| UpdatedAt | DateTime | Auto-set on update |

**Deprecated (migration compatibility only):** `Value` field — kept but ignored. Use `TotalValue` instead.

### 2.2 DealStage Enum

```csharp
public enum DealStage
{
    NEW,
    IN_PROGRESS,
    NEGOTIATION,
    WON,
    LOST
}
```

### 2.3 ProductType Enum

```csharp
public enum ProductType
{
    SILICONE,
    CREAM
}
```

---

## 3. Business Rules

### Rule 1: WON Transition Requirements
```
require:
- product (not null)
- quantity > 0
- total_value > 0
- activity within last 3 days (CALL or MEETING type only)
```

If requirements not met, API returns 400 BadRequest with reason.

### Rule 2: Locked Deal
```
if stage == WON or stage == LOST:
   cannot edit (PUT/DELETE returns 400 BadRequest)
   cannot change stage (PUT /stage returns 400 BadRequest)
   can still view
```

### Rule 3: Linear Stage Progression
```
NEW → IN_PROGRESS → NEGOTIATION → WON/LOST

Cannot skip stages. Cannot go backwards (except LOST can be reactivated to any stage per Rule 4).
```

### Rule 4: LOST Reactivation
```
LOST deals can be moved back to any previous stage (NEW, IN_PROGRESS, NEGOTIATION)
```

### Rule 5: Probability Auto-Update
```
NEW → 10%
IN_PROGRESS → 40%
NEGOTIATION → 70%
WON/LOST → probability unchanged at time of transition
```

---

## 4. Backend API

### 4.1 Create Deal
```
POST /api/deals
```
**Request:**
```json
{
  "doctorId": "guid",
  "product": "SILICONE" | "CREAM",
  "quantity": 100,
  "unitPrice": 150000,
  "expectedCloseDate": "2026-06-15",
  "notes": "string?"
}
```
**Response:** 201 Created with Deal object
**Validation:**
- DoctorId must exist
- Quantity > 0
- UnitPrice > 0
- SalesId defaults to current user
- Stage defaults to NEW
- Probability defaults to 10
- TotalValue computed: quantity × unitPrice

### 4.2 Update Deal
```
PUT /api/deals/{id}
```
**Response:** 200 OK, 400 BadRequest (locked), 404 NotFound
**Note:** Cannot update if deal is WON or LOST.

### 4.3 Update Stage (Drag & Drop)
```
PUT /api/deals/{id}/stage
```
**Request:**
```json
{
  "stage": "IN_PROGRESS"
}
```
**Validation:**
- Linear progression check (cannot skip stages)
- WON rule check (3-day activity requirement)
- Locked check (WON/LOST cannot transition)
**Response:** 200 OK, 400 BadRequest with reason, 404 NotFound

### 4.4 Get Pipeline
```
GET /api/deals/pipeline?managerId={guid?}
```
**Response:**
```json
{
  "stages": {
    "NEW": [
      { "id": "guid", "doctorName": "Dr. Smith", "totalValue": 15000000, "probability": 10, "expectedCloseDate": "..." }
    ],
    "IN_PROGRESS": [...],
    "NEGOTIATION": [...],
    "WON": [...],
    "LOST": [...]
  }
}
```
**Visibility:** If SalesManager → all team deals. If SalesMember → own deals only.

### 4.5 Get Forecast Revenue
```
GET /api/deals/forecast
```
**Response:**
```json
{
  "stages": [
    { "stage": "NEW", "count": 5, "totalValue": 75000000, "weightedValue": 7500000 },
    { "stage": "IN_PROGRESS", "count": 3, "totalValue": 45000000, "weightedValue": 18000000 },
    { "stage": "NEGOTIATION", "count": 2, "totalValue": 30000000, "weightedValue": 21000000 }
  ],
  "totalPipelineValue": 150000000,
  "weightedForecast": 46500000
}
```
**Formula:** WeightedValue = TotalValue × (Probability / 100)

### 4.6 Other Endpoints
- `GET /api/deals/{id}` — Get single deal
- `DELETE /api/deals/{id}` — Delete (locked if WON/LOST)
- `GET /api/deals` — List deals with pagination

---

## 5. Frontend Design

### 5.1 Kanban Board Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Deals                                    [+ Add Deal]   [Forecast]  │
├────────────┬────────────┬────────────┬────────────┬────────────┬─────┤
│   NEW      │IN_PROGRESS │ NEGOTIATION│    WON     │    LOST    │     │
│   (3)      │   (5)      │    (2)     │    (8)     │    (1)     │     │
│            │            │            │            │            │     │
│ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │     │
│ │Dr.Smith│ │ │Dr.John │ │ │Dr.Davis│ │ │Dr.Brown│ │ │Dr.Lee   │ │     │
│ │15M VND │ │ │8M VND  │ │ │20M VND │ │ │12M VND │ │ │5M VND  │ │     │
│ │10% · Jun│ │ │40% · Jul│ │ │70% · May│ │ │100% ✓ │ │ │Lost    │ │     │
│ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │     │
│            │            │            │            │            │     │
│ ┌────────┐ │            │            │            │            │     │
│ │Dr.Wang │ │            │            │            │            │     │
│ │10M VND │ │            │            │            │            │     │
│ └────────┘ │            │            │            │            │     │
└────────────┴────────────┴────────────┴────────────┴────────────┴─────┘
```

### 5.2 Deal Card

```
┌─────────────────────────┐
│ 👤 Dr. Nguyen Van A     │  ← Doctor name (clickable → detail drawer)
│ 💰 15,000,000 VND        │  ← Total value (formatted)
│ 📅 Jun 15 · 40%          │  ← Expected close + probability
│ [Call] [Email] [Edit]    │  ← Action buttons (only if not locked)
└─────────────────────────┘
```

**Card states:**
- Default: white bg, subtle border
- Dragging: elevated shadow, slight rotation
- Locked (WON/LOST): muted colors, no drag handle, edit buttons hidden
- Hover: shadow lift

### 5.3 Add Deal Modal

Fields:
- Doctor (dropdown, searchable)
- Product (dropdown: SILICONE, CREAM)
- Quantity (number input)
- Unit Price (number input, VND)
- Expected Close Date (date picker, optional)

**Auto-calculate:** Show TotalValue = Quantity × UnitPrice

### 5.4 Deal Detail Drawer

Side drawer (right side), 400px wide. Shows:
- Doctor name + hospital
- All deal fields (editable)
- Activity timeline (recent CALL/METING activities)
- Stage history

**Locked state:** Fields disabled, show lock icon + message "This deal is locked (WON/LOST)"

### 5.5 Drag & Drop Behavior

Using `@hello-pangea/dnd`:
- Only drag FROM and TO columns that are valid transitions
- Linear rule enforced on frontend (disable invalid drops) + backend (validate on PUT)
- WON/LOST columns: cards cannot be dragged OUT (locked)
- On drop: call `PUT /api/deals/{id}/stage` with new stage

### 5.6 Dashboard Widget (Pipeline Metrics)

```
┌─────────────────────────────────────────┐
│ Pipeline Overview                        │
├───────────┬───────────┬──────────────────┤
│ 10 Deals  │ ₮150M     │ 📊 Weighted: ₮46M│
│ in pipeline│ pipeline │ (probability adj)│
└───────────┴───────────┴──────────────────┘
```

Small card at top of Dashboard or dedicated section.

---

## 6. Implementation Tasks

### Backend
1. Add `ProductType` enum to `Enums.cs` (SILICONE, CREAM)
2. Update `Deal` entity — add `Quantity`, `UnitPrice`, `TotalValue` fields, deprecate `Value`
3. Add `DealStage` to `Enums.cs` if not exists (should already exist)
4. Create `IDealRepository` + `DealRepository`
5. Create `IDealService` + `DealService` (with team filtering, stage validation, WON rule check)
6. Create `DealsController` with all endpoints
7. Update database (drop + recreate for new fields)

### Frontend
1. Add Deal types to `types/index.ts`
2. Create `dealService.ts`
3. Create `Deals.tsx` page with Kanban board
4. Create `AddDealModal.tsx` component
5. Create `DealDetailDrawer.tsx` component
6. Add deals route to `App.tsx`
7. Add deals menu item to `menuConfig.tsx`
8. Add pipeline forecast widget to `Dashboard.tsx`

### Deferred
- Engagement Board (Module 3.5) — deferred to future iteration
- Edit deal (PUT) form — included in detail drawer, locked if WON/LOST

---

## 7. Deferred Items (Not in MVP)

Per user request: Note in spec that these are deferred to future iterations:
- **Engagement Board** — Full doctor engagement tracking beyond deals
- **Priority Scoring Algorithm** — Score-based deal prioritization
- **Manager Team View** — Manager-specific dashboard for team performance

---

## 8. API Response Codes

| Endpoint | Success | Errors |
|----------|---------|--------|
| POST /deals | 201 + Deal | 400 validation, 404 doctor not found |
| PUT /deals/{id} | 200 | 400 locked/validation, 404 |
| PUT /deals/{id}/stage | 200 | 400 invalid transition/WON rule |
| GET /deals | 200 + list | - |
| GET /deals/{id} | 200 + Deal | 404 |
| GET /deals/pipeline | 200 + grouped | - |
| GET /deals/forecast | 200 + metrics | - |
| DELETE /deals/{id} | 204 | 400 locked, 404 |
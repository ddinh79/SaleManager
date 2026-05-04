# Deal Pipeline - Enhancement Design

> **Goal:** Enhance the existing Kanban deal pipeline with SignalR realtime sync, gap-based ordering, optimistic UI, concurrency guards, and structured lost reason capture.

## Architecture

**Backend:** .NET 8, EF Core + SQLite, SignalR hub at `/hubs/deals`
**Frontend:** React 18, TypeScript, Zustand, `@hello-pangea/dnd`, SignalR client

**Realtime flow:**
```
User drags deal → Optimistic UI update
               → PUT /api/deals/{id}/stage (expectedVersion)
               → On success → SignalR broadcast "DealUpdated"
               → Other clients receive via SignalR
               → Connection lost → fallback 30s polling
```

**Position strategy:** Gap-based integers (1000, 2000...). Rebalance when gap < 10.

---

## Data Model Changes

### Deal Entity Changes

| Field | Type | Note |
|-------|------|------|
| `Position` | int | Gap-based ordering within column |
| `LostReason` | string? | Nullable - structured reason |
| `LostNotes` | string? | Optional free text |
| `Version` | int | Concurrency token |

### New Enum: LostReason
```csharp
COMPETITOR, BUDGET, TIMELINE, NO_RESPONSE, PRODUCT_MISMATCH, OTHER
```

### API Changes

| Endpoint | Change |
|----------|--------|
| `PUT /api/deals/{id}/stage` | +`expectedVersion` int, +`lostReason` string? |
| `GET /api/deals/pipeline` | Returns `Metrics` per stage in response |
| `PUT /api/deals/reorder` | New - batch reorder positions |

### Pipeline Response
```json
{
  "stages": { "NEW": [...], "IN_PROGRESS": [...] },
  "metrics": {
    "NEW": { "count": 5, "totalValue": 50000000 },
    "IN_PROGRESS": { "count": 3, "totalValue": 30000000 }
  }
}
```

---

## Backend Tasks

### Task 1: Deal Entity & Enum Changes
- Add `Position`, `LostReason`, `LostNotes`, `Version` to Deal.cs
- Add `LostReason` enum to Enums.cs
- Add `UpdateStageRequest.LostReason`, `UpdateStageRequest.ExpectedVersion`
- Add `ReorderRequest` DTO
- Add `PipelineResponse.Metrics`
- Run `dotnet ef migrations add AddDealPipelineFields`

### Task 2: DealHub SignalR
- Create `backend/Hubs/DealHub.cs`
- Methods: `JoinPipeline()`, `LeavePipeline()`, `DealUpdated()`, `DealCreated()`, `DealDeleted()`
- Register in Program.cs

### Task 3: DealsController Changes
- Add `PUT {id}/stage` expectedVersion + lostReason
- Add `PUT /deals/reorder` endpoint
- Add `GET /deals/pipeline` returns metrics

### Task 4: DealService Business Logic
- Add position/reorder logic with gap-based algorithm
- Add concurrency check (Version match)
- Add lost reason storage
- Add metrics calculation in pipeline query
- Broadcast SignalR events on stage change

### Task 5: Verify Backend
- Run `dotnet build` - no errors
- Seed data works, API responds

---

## Frontend Tasks

### Task 6: Frontend Types & API
- Add `expectedVersion` to `UpdateStageRequest`
- Add `lostReason` to DTO
- Add `metrics` to PipelineResponse
- Add `reorder` to dealService

### Task 7: SignalR Hook
- Create `frontend/src/hooks/useDealSignalR.ts`
- Connect to `/hubs/deals`
- Fallback polling on disconnect
- Return `{ connection, pipeline }`

### Task 8: Deals.tsx Enhancements
- Connect SignalR on mount
- Optimistic UI update on drag
- Rollback on failure
- Show column metrics in headers
- Filter bar (sales, product)

### Task 9: LostReasonModal
- New modal component
- Dropdown of LostReason enum
- Optional notes textarea

### Task 10: DealCard Enhancements
- Show ai_score badge if > 70
- Hot indicator (red border) if overdue or high value

### Task 11: Verify Frontend
- `npm run dev` - no build errors
- Browser devtools - no console errors

---

## Acceptance Criteria

- [ ] Drag-drop updates UI instantly (optimistic)
- [ ] Stage change syncs to DB and broadcasts via SignalR
- [ ] Concurrent edit → 409 toast shown
- [ ] Column header shows count + total value
- [ ] Lost reason modal appears before deal enters LOST
- [ ] Positions persist after page reload
- [ ] SignalR fallback polling activates on disconnect

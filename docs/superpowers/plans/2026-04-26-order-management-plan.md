# Order Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Module 3.5 - Auto-create orders from won deals, order status flow (PENDING_APPROVAL → APPROVED → READY_TO_SHIP → SHIPPED → COMPLETED), manager approval workflow.

**Architecture:** Orders auto-created when deal becomes WON. Order status transitions only via manager actions. Orders are immutable (no edit/delete). Follows existing Service+Repository pattern.

**Tech Stack:** .NET 8, Entity Framework Core (SQLite), React 18, TailwindCSS, Zustand

---

## File Map

### Backend (Create/Modify)
```
backend/
  Entities/
    Enums.cs                    # Replace OrderStatus enum
    Order.cs                    # Update TotalValue → TotalAmount if needed
  Repositories/
    IOrderRepository.cs         # NEW
    OrderRepository.cs          # NEW
  Services/
    IOrderService.cs            # NEW
    OrderService.cs             # NEW
  Controllers/
    OrdersController.cs         # NEW
  Data/
    AppDbContext.cs             # Check Order DbSet config
```

### Frontend (Create/Modify)
```
frontend/src/
  types/index.ts                # Add Order types
  services/orderService.ts     # NEW
  pages/Orders.tsx             # NEW
  navigation/menuConfig.tsx     # Add Orders menu item
  App.tsx                       # Add Orders route
```

---

## Backend Tasks

### Task 1: Update OrderStatus Enum

**Files:**
- Modify: `backend/Entities/Enums.cs`

- [ ] **Step 1: Read existing Enums.cs**

Run: `Read backend/Entities/Enums.cs`
Expected: Shows existing OrderStatus enum (Pending, Shipped, Completed)

- [ ] **Step 2: Replace OrderStatus enum**

Edit `backend/Entities/Enums.cs` — REPLACE existing OrderStatus with:
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

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Entities/Enums.cs
git commit -m "feat(orders): replace OrderStatus enum with new values"
```

---

### Task 2: Update Order Entity

**Files:**
- Modify: `backend/Entities/Order.cs`

- [ ] **Step 1: Read existing Order.cs**

Run: `Read backend/Entities/Order.cs`
Expected: Shows existing Order entity with TotalValue field

- [ ] **Step 2: Update Order entity if needed**

Check if TotalValue should be renamed to TotalAmount (per spec). If current code uses TotalValue, keep it but ensure it's properly mapped from deal.TotalValue.

The current entity has:
- DealId, DoctorId, Product, Quantity, Price, TotalValue, Status, CreatedAt, UpdatedAt

This should work. No changes needed unless field names differ.

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Entities/Order.cs
git commit -m "feat(orders): update Order entity fields"
```

---

### Task 3: Create IOrderRepository

**Files:**
- Create: `backend/Repositories/IOrderRepository.cs`

- [ ] **Step 1: Create IOrderRepository.cs**

Create `backend/Repositories/IOrderRepository.cs`:
```csharp
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Order>> GetAllWithDetailsAsync();
    Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status);
    Task<IEnumerable<Order>> GetByDoctorIdAsync(Guid doctorId);
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Repositories/IOrderRepository.cs
git commit -m "feat(orders): add IOrderRepository interface"
```

---

### Task 4: Create OrderRepository

**Files:**
- Create: `backend/Repositories/OrderRepository.cs`

- [ ] **Step 1: Create OrderRepository.cs**

Create `backend/Repositories/OrderRepository.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(AppDbContext context) : base(context) { }

    public async Task<Order?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(o => o.Deal)
            .Include(o => o.Doctor)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<IEnumerable<Order>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(o => o.Doctor)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status)
    {
        return await _dbSet
            .Include(o => o.Doctor)
            .Where(o => o.Status == status)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetByDoctorIdAsync(Guid doctorId)
    {
        return await _dbSet
            .Include(o => o.Doctor)
            .Where(o => o.DoctorId == doctorId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Repositories/OrderRepository.cs
git commit -m "feat(orders): add OrderRepository"
```

---

### Task 5: Create Order DTOs

**Files:**
- Create: `backend/DTOs/OrderDtos.cs`

- [ ] **Step 1: Create OrderDtos.cs**

Create `backend/DTOs/OrderDtos.cs`:
```csharp
using SalesSystem.Entities;

namespace SalesSystem.DTOs;

// ============ Response ============

public class OrderResponse
{
    public Guid Id { get; set; }
    public Guid DealId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OrderListResponse
{
    public List<OrderResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/DTOs/OrderDtos.cs
git commit -m "feat(orders): add order DTOs"
```

---

### Task 6: Create IOrderService

**Files:**
- Create: `backend/Services/IOrderService.cs`

- [ ] **Step 1: Create IOrderService.cs**

Create `backend/Services/IOrderService.cs`:
```csharp
using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public interface IOrderService
{
    Task<OrderListResponse> GetOrdersAsync(OrderStatus? status = null, Guid? doctorId = null);
    Task<OrderResponse?> GetOrderByIdAsync(Guid id);
    Task<OrderResponse?> ApproveOrderAsync(Guid id);
    Task<OrderResponse?> MarkReadyToShipAsync(Guid id);
    Task<OrderResponse?> ShipOrderAsync(Guid id);
    Task<OrderResponse?> CompleteOrderAsync(Guid id);
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Services/IOrderService.cs
git commit -m "feat(orders): add IOrderService interface"
```

---

### Task 7: Create OrderService

**Files:**
- Create: `backend/Services/OrderService.cs`

- [ ] **Step 1: Create OrderService.cs**

Create `backend/Services/OrderService.cs`:
```csharp
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepo;

    public OrderService(IOrderRepository orderRepo)
    {
        _orderRepo = orderRepo;
    }

    public async Task<OrderListResponse> GetOrdersAsync(OrderStatus? status = null, Guid? doctorId = null)
    {
        IEnumerable<Order> orders;

        if (status.HasValue)
        {
            orders = await _orderRepo.GetByStatusAsync(status.Value);
        }
        else if (doctorId.HasValue)
        {
            orders = await _orderRepo.GetByDoctorIdAsync(doctorId.Value);
        }
        else
        {
            orders = await _orderRepo.GetAllWithDetailsAsync();
        }

        var items = orders.Select(MapToOrderResponse).ToList();
        return new OrderListResponse { Items = items, TotalCount = items.Count };
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;
        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> ApproveOrderAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.PENDING_APPROVAL)
            throw new InvalidOperationException("Order must be PENDING_APPROVAL to approve");

        order.Status = OrderStatus.APPROVED;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> MarkReadyToShipAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.APPROVED)
            throw new InvalidOperationException("Order must be APPROVED to mark ready to ship");

        order.Status = OrderStatus.READY_TO_SHIP;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> ShipOrderAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.READY_TO_SHIP)
            throw new InvalidOperationException("Order must be READY_TO_SHIP to ship");

        order.Status = OrderStatus.SHIPPED;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> CompleteOrderAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.SHIPPED)
            throw new InvalidOperationException("Order must be SHIPPED to complete");

        order.Status = OrderStatus.COMPLETED;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    private OrderResponse MapToOrderResponse(Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            DealId = order.DealId,
            DoctorId = order.DoctorId,
            DoctorName = order.Doctor?.Name ?? "",
            Product = order.Product.ToString(),
            Quantity = order.Quantity,
            Price = order.Price,
            TotalAmount = order.TotalValue, // Note: entity has TotalValue, mapping to TotalAmount
            Status = order.Status.ToString(),
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt
        };
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Services/OrderService.cs
git commit -m "feat(orders): add OrderService"
```

---

### Task 8: Create OrdersController

**Files:**
- Create: `backend/Controllers/OrdersController.cs`

- [ ] **Step 1: Create OrdersController.cs**

Create `backend/Controllers/OrdersController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Entities;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<OrderListResponse>> GetOrders([FromQuery] string? status = null, [FromQuery] Guid? doctorId = null)
    {
        OrderStatus? orderStatus = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var parsed))
        {
            orderStatus = parsed;
        }

        var result = await _orderService.GetOrdersAsync(orderStatus, doctorId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetOrder(Guid id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<OrderResponse>> ApproveOrder(Guid id)
    {
        try
        {
            var order = await _orderService.ApproveOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/ready")]
    public async Task<ActionResult<OrderResponse>> MarkReadyToShip(Guid id)
    {
        try
        {
            var order = await _orderService.MarkReadyToShipAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/ship")]
    public async Task<ActionResult<OrderResponse>> ShipOrder(Guid id)
    {
        try
        {
            var order = await _orderService.ShipOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<OrderResponse>> CompleteOrder(Guid id)
    {
        try
        {
            var order = await _orderService.CompleteOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Controllers/OrdersController.cs
git commit -m "feat(orders): add OrdersController with status transition endpoints"
```

---

### Task 9: Modify DealService to Auto-Create Order on WON

**Files:**
- Modify: `backend/Services/DealService.cs`

- [ ] **Step 1: Read existing DealService.cs**

Run: `Read backend/Services/DealService.cs`
Expected: Shows UpdateStageAsync method

- [ ] **Step 2: Add IOrderRepository to DealService**

Add constructor parameter and field:
```csharp
private readonly IOrderRepository _orderRepo;
```

Update constructor:
```csharp
public DealService(AppDbContext context, IDealRepository dealRepo, IDoctorRepository doctorRepo, IUserRepository userRepo, IOrderRepository orderRepo)
{
    _context = context;
    _dealRepo = dealRepo;
    _doctorRepo = doctorRepo;
    _userRepo = userRepo;
    _orderRepo = orderRepo;
}
```

- [ ] **Step 3: Update UpdateStageAsync to create order when WON**

In the `UpdateStageAsync` method, after the line `deal.Stage = newStage;` and before `await _dealRepo.UpdateAsync(deal);`, add:

```csharp
// Auto-create order when deal becomes WON
if (newStage == DealStage.WON && oldStage != DealStage.WON)
{
    var order = new Order
    {
        DealId = deal.Id,
        DoctorId = deal.DoctorId,
        Product = deal.Product,
        Quantity = deal.Quantity,
        Price = deal.UnitPrice,
        TotalValue = deal.TotalValue,
        Status = OrderStatus.PENDING_APPROVAL,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };
    await _orderRepo.AddAsync(order);
}
```

- [ ] **Step 4: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add backend/Services/DealService.cs
git commit -m "feat(orders): auto-create order when deal becomes WON"
```

---

### Task 10: Register Order Dependencies in Program.cs

**Files:**
- Modify: `backend/Program.cs`

- [ ] **Step 1: Read Program.cs to find DI registration section**

Run: `Read backend/Program.cs`
Expected: Shows services.AddScoped calls

- [ ] **Step 2: Add Order service and repository DI registration**

Add to the DI section:
```csharp
// Order
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Program.cs
git commit -m "feat(orders): register OrderService and OrderRepository in DI"
```

---

### Task 11: Update Database (Recreate with New Schema)

**Files:**
- Delete: `backend/salesystem.db`

- [ ] **Step 1: Delete and rebuild**

Run: `rm backend/salesystem.db -ErrorAction SilentlyContinue; cd backend; dotnet build`

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: recreate database with new OrderStatus enum values"
```

---

## Frontend Tasks

### Task 12: Add Order Types to types/index.ts

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Read existing types**

Run: `Read frontend/src/types/index.ts`
Expected: Shows existing interfaces

- [ ] **Step 2: Add Order types**

Add to the types file:
```typescript
// Order types
export type OrderStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED';

export interface Order {
  id: string;
  dealId: string;
  doctorId: string;
  doctorName: string;
  product: ProductType;
  quantity: number;
  price: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  items: Order[];
  totalCount: number;
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(orders): add Order types to frontend"
```

---

### Task 13: Create orderService.ts

**Files:**
- Create: `frontend/src/services/orderService.ts`

- [ ] **Step 1: Create orderService.ts**

Create `frontend/src/services/orderService.ts`:
```typescript
import api from './api';
import type { Order, OrderListResponse, OrderStatus } from '../types';

export const orderService = {
  getOrders: async (status?: OrderStatus, doctorId?: string): Promise<OrderListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (doctorId) params.append('doctorId', doctorId);
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  approve: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/approve`);
    return response.data;
  },

  markReady: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/ready`);
    return response.data;
  },

  ship: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/ship`);
    return response.data;
  },

  complete: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/complete`);
    return response.data;
  },
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/orderService.ts
git commit -m "feat(orders): add orderService with status transition APIs"
```

---

### Task 14: Create Orders.tsx Page

**Files:**
- Create: `frontend/src/pages/Orders.tsx`

- [ ] **Step 1: Create Orders.tsx**

Create `frontend/src/pages/Orders.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import type { Order, OrderStatus } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CheckCircle, Truck, Package } from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'bg-gray-100 text-gray-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  READY_TO_SHIP: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'Pending',
  APPROVED: 'Approved',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipping',
  COMPLETED: 'Completed',
};

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; icon: React.ReactNode; api: 'approve' | 'markReady' | 'ship' | 'complete' }>> = {
  PENDING_APPROVAL: { label: 'Approve', icon: <CheckCircle className="w-4 h-4" />, api: 'approve' },
  APPROVED: { label: 'Ready to Ship', icon: <Package className="w-4 h-4" />, api: 'markReady' },
  READY_TO_SHIP: { label: 'Ship', icon: <Truck className="w-4 h-4" />, api: 'ship' },
  SHIPPED: { label: 'Complete', icon: <CheckCircle className="w-4 h-4" />, api: 'complete' },
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await orderService.getOrders(status);
      setOrders(data.items);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId: string, action: 'approve' | 'markReady' | 'ship' | 'complete') => {
    setActionLoading(orderId);
    try {
      switch (action) {
        case 'approve':
          await orderService.approve(orderId);
          break;
        case 'markReady':
          await orderService.markReady(orderId);
          break;
        case 'ship':
          await orderService.ship(orderId);
          break;
        case 'complete':
          await orderService.complete(orderId);
          break;
      }
      loadOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order: ' + (error as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | 'ALL')}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="ALL">All</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="READY_TO_SHIP">Ready to Ship</option>
          <option value="SHIPPED">Shipping</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No orders found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => {
                const nextAction = NEXT_ACTION[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-800">{order.doctorName}</div>
                      <div className="text-xs text-slate-500">{order.product}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-800">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-xs text-slate-500">{order.quantity} units</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {nextAction && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(order.id, nextAction.api)}
                          loading={actionLoading === order.id}
                        >
                          {nextAction.icon}
                          {nextAction.label}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Orders.tsx
git commit -m "feat(orders): add Orders page with table UI and status actions"
```

---

### Task 15: Add Orders Route to App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read App.tsx**

Run: `Read frontend/src/App.tsx`
Expected: Shows React Router setup with lazy loading

- [ ] **Step 2: Add Orders import and route**

Add the Orders import:
```tsx
const Orders = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
```

Add route:
```tsx
<Route path="orders" element={<Orders />} />
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(orders): add Orders route to App.tsx"
```

---

### Task 16: Add Orders Menu Item

**Files:**
- Modify: `frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 1: Read menuConfig.tsx**

Run: `Read frontend/src/navigation/menuConfig.tsx`
Expected: Shows menu structure with icons and roles

- [ ] **Step 2: Add Orders menu item**

Add to MAIN section (import `ShoppingCart` from lucide-react):
```tsx
{ label: 'Orders', path: '/orders', icon: <ShoppingCart className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/navigation/menuConfig.tsx
git commit -m "feat(orders): add Orders menu item"
```

---

## Verification

After all tasks:

1. **Backend build:**
   ```bash
   cd backend; dotnet build
   ```
   Expected: 0 errors

2. **Frontend TypeScript:**
   ```bash
   cd frontend; npx tsc --noEmit
   ```
   Expected: 0 errors

3. **Test flow:**
   - Create a deal with a doctor
   - Move deal to WON (via activities)
   - Check that an order was auto-created with status PENDING_APPROVAL
   - Approve the order (should become APPROVED)
   - Ready to ship (should become READY_TO_SHIP)
   - Ship (should become SHIPPED)
   - Complete (should become COMPLETED)

---

## Self-Review Checklist

- [ ] All spec requirements covered by tasks?
- [ ] No TBD/TODO placeholders?
- [ ] Types consistent across tasks?
- [ ] All builds pass?
- [ ] Auto-create order on deal.WON implemented?
- [ ] Status transitions enforce correct flow?
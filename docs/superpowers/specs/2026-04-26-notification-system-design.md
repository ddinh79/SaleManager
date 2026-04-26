# Notification System Design Spec

**Date:** 2026-04-26
**Status:** Draft

---

## 1. Overview

A production-ready notification system for the Sales CRM that delivers real-time alerts to users via SignalR push, with background job scheduling, deduplication, and a full notification UI (bell icon + dropdown + full page).

**Rules:**
1. **Follow-up reminder** — When a deal has no activity for X days (configurable), alert the assigned sales member
2. **Deal closing soon** — Alert sales/manager when a deal's `expectedCloseDate` is within N days
3. **Inactive sales** — Alert manager when a sales member has no activity for 5+ days

**Anti-spam:** Daily cap per type per user (1 notification per NotificationType per user per calendar day). No duplicates.

**Startup:** Backfill missed notifications for last 7 days on application startup.

---

## 2. Database Design

### 2.1 Notification Entity (existing — extend)

```csharp
public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }

    public NotificationType Type { get; set; }  // FollowUpReminder, DealClosing, InactiveAlert

    [Required, MaxLength(200)]
    public string Title { get; set; }

    [Required, MaxLength(1000)]
    public string Message { get; set; }

    public Guid? ReferenceId { get; set; }  // links to Deal/Doctor/Activity
    public string? ReferenceType { get; set; }  // "Deal", "Doctor", "User"

    public bool IsRead { get; set; } = false;

    public NotificationPriority Priority { get; set; }  // Low, Normal, High, Urgent

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### 2.2 NotificationPriority Enum (new)

```csharp
public enum NotificationPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3
}
```

### 2.3 NotificationDedup Table (new — for spam prevention)

```csharp
public class NotificationDedup
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public DateTime Date { get; set; }  // date only (no time) — composite key with Type
}
```

Composite unique key: `(UserId, Type, Date)`

### 2.4 NotificationSettings Entity (new — per-user preferences)

```csharp
public class NotificationSettings
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }

    public bool FollowUpReminderEnabled { get; set; } = true;
    public bool DealClosingEnabled { get; set; } = true;
    public bool InactiveAlertEnabled { get; set; } = true;
}
```

Single row per user — default to all enabled.

---

## 3. Notification Rules

### Rule 1: Follow-up Reminder
- **Trigger:** Deal has no activities for N days (default: 3 days)
- **Who receives:** Assigned sales member
- **Priority:** High
- **Message:** "Deal '{dealName}' has no activity for {N} days. Follow up with {doctorName}."
- **Reference:** Deal ID

### Rule 2: Deal Closing Soon
- **Trigger:** Deal's `expectedCloseDate` is within M days (default: 7 days) AND stage is NOT WON/LOST
- **Who receives:** Sales member AND their manager
- **Priority:** Normal (High if within 2 days)
- **Message:** "Deal '{dealName}' is expected to close on {date}. Current stage: {stage}."
- **Reference:** Deal ID

### Rule 3: Inactive Sales Alert
- **Trigger:** Sales member has no activity for 5+ days
- **Who receives:** Their manager
- **Priority:** Urgent
- **Message:** "{salesName} has been inactive for {N} days. Last activity: {lastActivityDate}."
- **Reference:** User ID

---

## 4. Background Jobs

### NotificationBackgroundService (IHostedService)

Runs on a `Timer` every **15 minutes**.

```
┌─────────────────────────────────────────────────────────┐
│  On Timer Tick (every 15 min)                           │
│                                                         │
│  1. RunFollowUpReminders()                             │
│     → Check deals with no activity in last 3 days       │
│     → Dedupe by UserId+Type+Today                       │
│     → Create Notification + SignalR push                 │
│                                                         │
│  2. RunDealClosingAlerts()                              │
│     → Check deals closing in next 7 days                │
│     → Dedupe by UserId+Type+Today                       │
│     → Create Notification + SignalR push                │
│                                                         │
│  3. RunInactiveSalesAlerts()                            │
│     → Check sales with no activity in last 5 days      │
│     → Dedupe by UserId+Type+Today                       │
│     → Create Notification + SignalR push                │
└─────────────────────────────────────────────────────────┘
```

### On Startup (backfill)
- Run a full sweep for the **last 7 days** to catch missed notifications
- Use `DateTime.UtcNow.AddDays(-7)` as the cutoff
- Same deduplication logic applies

### Dedup Logic
Before creating any notification:
```csharp
var dedupKey = $"{userId}_{type}_{DateTime.UtcNow:yyyy-MM-dd}";
if (await _dedupRepo.ExistsAsync(dedupKey)) return; // skip
```

After creating:
```csharp
await _dedupRepo.AddAsync(new NotificationDedup { UserId = userId, Type = type, Date = today });
```

---

## 5. Backend API

### GET /api/notifications
**Auth:** Bearer token (any role)
**Query params:** `?page=1&pageSize=20&unreadOnly=false`

**Response:**
```json
{
  "items": [
    {
      "id": "guid",
      "type": "FollowUpReminder",
      "title": "Follow up needed",
      "message": "Deal 'X' has no activity for 3 days",
      "referenceId": "deal-guid",
      "referenceType": "Deal",
      "isRead": false,
      "priority": "High",
      "createdAt": "2026-04-26T10:00:00Z"
    }
  ],
  "total": 50,
  "unreadCount": 5,
  "page": 1,
  "pageSize": 20
}
```

### GET /api/notifications/unread-count
**Auth:** Bearer token (any role)

**Response:**
```json
{
  "count": 5
}
```

### POST /api/notifications/{id}/read
**Auth:** Bearer token (any role)
**Description:** Mark a single notification as read

**Response:** `204 No Content`

### POST /api/notifications/read-all
**Auth:** Bearer token (any role)
**Description:** Mark all notifications for current user as read

**Response:** `204 No Content`

### POST /api/notifications/settings
**Auth:** Bearer token (any role)
**Body:**
```json
{
  "followUpReminderEnabled": true,
  "dealClosingEnabled": true,
  "inactiveAlertEnabled": false
}
```
**Response:** `200 OK` with updated settings

### GET /api/notifications/settings
**Auth:** Bearer token (any role)

**Response:**
```json
{
  "followUpReminderEnabled": true,
  "dealClosingEnabled": true,
  "inactiveAlertEnabled": true
}
```

---

## 6. SignalR Hub

### Hub: `/hubs/notifications`

**Client methods (server → client):**
- `ReceiveNotification(notification)` — pushed when a new notification is created
- `UpdateUnreadCount(count)` — pushed when unread count changes

**Server methods (client → server):**
- `JoinUserGroup()` — called on connection, adds user to their own SignalR group
- `LeaveUserGroup()` — called on disconnect

### User Groups
Each user joins a group named `User_{userId}`. When a notification is created, push only to that user's group.

---

## 7. Frontend

### 7.1 Notification Bell Component (`TopBarNew.tsx`)

The bell icon in `TopBarNew` already exists — need to:
- Connect to SignalR hub on mount
- Show unread count badge (from SignalR `UpdateUnreadCount`)
- Click → open NotificationDropdown

```
┌────────────────────────────────────┐
│ 🔔 [5]                             │  ← red badge if unread > 0
│    └─ NotificationDropdown         │
└────────────────────────────────────┘
```

### 7.2 NotificationDropdown Component (new)

Shows top 5 recent notifications:
```
┌──────────────────────────────────────┐
│ Notifications                [Mark all read]
├──────────────────────────────────────┤
│ 🔴 [URGENT] Inactive alert           │
│    Sales1 has been inactive 6 days  │
│    2 minutes ago                     │
├──────────────────────────────────────┤
│ 🟠 [HIGH] Follow-up reminder        │
│    Deal 'X' needs follow up         │
│    1 hour ago                        │
├──────────────────────────────────────┤
│ 🟡 [NORMAL] Deal closing soon        │
│    Deal 'Y' closes in 3 days        │
│    3 hours ago                       │
├──────────────────────────────────────┤
│         [View all notifications]     │  → /notifications
└──────────────────────────────────────┘
```

### 7.3 Full Notifications Page (/notifications)

- List all notifications with pagination
- Filter by: All / Unread / Type
- Sort by: Newest first
- Click row → navigate to reference (deal, doctor, etc.)
- Mark as read on click
- "Mark all as read" button

### 7.4 NotificationSettings Page (/notifications/settings)

- Toggle switches for each notification type
- Changes saved via PATCH /api/notifications/settings

---

## 8. Click-to-Navigate

When user clicks a notification:
1. Mark as read (PATCH)
2. Navigate based on `referenceType`:
   - `Deal` → `/deals/{referenceId}`
   - `Doctor` → `/doctors/{referenceId}`
   - `User` → `/users/{referenceId}`

---

## 9. Deduplication Strategy

**Goal:** No spam. Only 1 notification per type per user per day.

**Implementation:**
- Before creating notification, check `NotificationDedup` table for `(UserId, Type, Date)`
- If exists → skip
- If not → create notification AND add dedup entry
- Date = UTC date only (strip time)

**Edge cases:**
- Different reference IDs for same type → still deduped (same day, same type)
- Same trigger on next day → allowed (new dedup entry)

---

## 10. Priority Mapping

| Rule | Priority |
|------|----------|
| Follow-up reminder (3 days) | High |
| Deal closing in 7+ days | Normal |
| Deal closing in ≤2 days | High |
| Deal closing today/tomorrow | Urgent |
| Inactive sales (5-7 days) | Urgent |

---

## 11. SignalR Reconnection

- Frontend uses `@microsoft/signalr` client
- Auto-reconnect on disconnect
- On reconnect: re-join user group, fetch fresh unread count

---

## 12. Files to Create/Modify

### Backend
| File | Action |
|------|--------|
| `Entities/Notification.cs` | Extend with Priority, ReferenceType |
| `Entities/Enums.cs` | Add NotificationPriority enum |
| `Entities/NotificationDedup.cs` | New entity |
| `Entities/NotificationSettings.cs` | New entity |
| `DTOs/NotificationDtos.cs` | New — request/response DTOs |
| `Services/INotificationService.cs` | New interface |
| `Services/NotificationService.cs` | New — notification logic |
| `Services/INotificationBackgroundService.cs` | New interface |
| `Services/NotificationBackgroundService.cs` | New — IHostedService |
| `Hubs/NotificationHub.cs` | New SignalR hub |
| `Controllers/NotificationsController.cs` | New — REST API |
| `Data/AppDbContext.cs` | Add new DbSets |
| `Program.cs` | Register services, SignalR, background service |

### Frontend
| File | Action |
|------|--------|
| `services/notificationService.ts` | New |
| `hooks/useNotificationSignalR.ts` | New — SignalR connection hook |
| `components/NotificationDropdown.tsx` | New |
| `components/NotificationBell.tsx` | New (or integrate into TopBarNew) |
| `components/NotificationBadge.tsx` | New |
| `pages/Notifications.tsx` | New — full page |
| `pages/NotificationSettings.tsx` | New — settings page |
| `store/notificationStore.ts` | New — Zustand store for notifications |
| `App.tsx` | Add routes |
| `navigation/menuConfig.tsx` | Add notification link |
| `components/TopBarNew.tsx` | Integrate notification bell |

---

## 13. Dependencies

**Backend:**
- `Microsoft.AspNetCore.SignalR` (built-in with ASP.NET Core)
- No additional packages needed (IHostedService + Timer is built-in)

**Frontend:**
- `@microsoft/signalr` — SignalR client for React

---

## 14. Open Questions (resolved)

1. **Scheduling:** IHostedService + Timer (every 15 min)
2. **Settings storage:** Extend NotificationSettings entity (per-user row)
3. **Delivery:** SignalR real-time push + DB polling fallback (SignalR primary)
4. **Spam prevention:** Daily cap per type per user (1 per day)
5. **Startup backfill:** Run missed notifications sweep for last 7 days
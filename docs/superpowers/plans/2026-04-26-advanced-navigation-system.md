# Advanced Navigation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade navigation + routing system for Sales Execution SaaS with role-based access, lazy loading, command palette search, and breadcrumb system.

**Architecture:** Implement role-based sidebar navigation with lazy-loaded pages, protected routes with role guards, collapsible sidebar with animations, global search command palette (Ctrl+K), and auto-generated breadcrumbs. Use Zustand for global state (auth, UI, filters).

**Tech Stack:** React 18, TypeScript, React Router v6, TailwindCSS, Zustand, lucide-react

---

## File Map

### New Files (Create)
| File | Responsibility |
|------|----------------|
| `frontend/src/store/uiStore.ts` | Sidebar collapse, search modal state |
| `frontend/src/store/filterStore.ts` | Query param state management |
| `frontend/src/navigation/roleGuard.tsx` | Role-based access control component |
| `frontend/src/navigation/breadcrumb.tsx` | Auto-generate breadcrumbs from route |
| `frontend/src/navigation/menuConfig.tsx` | Centralized menu configuration by role |
| `frontend/src/components/CommandPalette.tsx` | Global search modal (Ctrl+K) |
| `frontend/src/components/SidebarNew.tsx` | Collapsible sidebar with animations |
| `frontend/src/components/TopBarNew.tsx` | Topbar with breadcrumb + search trigger |
| `frontend/src/pages/DoctorDetail.tsx` | Doctor detail with tabs |
| `frontend/src/pages/Interactions.tsx` | Task/activity list page |
| `frontend/src/pages/Activities.tsx` | Timeline activities page |
| `frontend/src/pages/Unauthorized.tsx` | Unauthorized access page |

### Modified Files
| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Lazy loading, protected routes with roles, new routes |
| `frontend/src/layouts/MainLayout.tsx` | Use new Sidebar/TopBar, handle sidebar collapse |
| `frontend/src/store/authStore.ts` | Add role helpers |
| `frontend/src/types/index.ts` | Add UserRole constants, Interaction type |

---

## Task 1: Create UI Store (Zustand)

**Files:**
- Create: `frontend/src/store/uiStore.ts`

- [ ] **Step 1: Create uiStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  searchModalOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      searchModalOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      openSearchModal: () => set({ searchModalOpen: true }),
      closeSearchModal: () => set({ searchModalOpen: false }),
    }),
    { name: 'ui-storage' }
  )
);
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/uiStore.ts
git commit -m "feat(ui): add uiStore for sidebar and search modal state"
```

---

## Task 2: Create Filter Store

**Files:**
- Create: `frontend/src/store/filterStore.ts`

- [ ] **Step 1: Create filterStore.ts**

```typescript
import { create } from 'zustand';

interface FilterState {
  doctorIdFilter: string | null;
  roleFilter: string | null;
  statusFilter: string | null;
  setDoctorIdFilter: (id: string | null) => void;
  setRoleFilter: (role: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  doctorIdFilter: null,
  roleFilter: null,
  statusFilter: null,
  setDoctorIdFilter: (id) => set({ doctorIdFilter: id }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  clearFilters: () => set({ doctorIdFilter: null, roleFilter: null, statusFilter: null }),
}));
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/filterStore.ts
git commit -m "feat(store): add filterStore for query param state"
```

---

## Task 3: Update Auth Store with Role Helpers

**Files:**
- Modify: `frontend/src/store/authStore.ts:1-36`

- [ ] **Step 1: Add role constants and helpers to authStore**

Replace the entire file content with:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

export const ROLES = {
  ADMIN: 'ADMIN' as UserRole,
  SALES_MANAGER: 'SALES_MANAGER' as UserRole,
  SALES_MEMBER: 'SALES_MEMBER' as UserRole,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  SALES_MEMBER: 'Sales Member',
};

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token: string, user: User) =>
        set({ token, user, isAuthenticated: true }),
      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },
    }),
    { name: 'auth-storage' }
  )
);
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/authStore.ts
git commit -m "feat(auth): add role helpers and constants to authStore"
```

---

## Task 4: Create Menu Configuration

**Files:**
- Create: `frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 1: Create menuConfig.tsx**

```typescript
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  MessageSquare,
  Activity,
} from 'lucide-react';
import type { UserRole } from '../types';

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export interface MenuSection {
  label: string;
  items: MenuItem[];
}

export const menuConfig: MenuSection[] = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['ADMIN', 'SALES_MANAGER', 'SALES_MEMBER'] },
    ],
  },
  {
    label: 'SALES',
    items: [
      { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'] },
      { label: 'Doctors', path: '/doctors', icon: <Stethoscope className="w-5 h-5" />, roles: ['ADMIN', 'SALES_MANAGER', 'SALES_MEMBER'] },
      { label: 'Interactions', path: '/interactions', icon: <MessageSquare className="w-5 h-5" />, roles: ['ADMIN', 'SALES_MANAGER'] },
      { label: 'Activities', path: '/activities', icon: <Activity className="w-5 h-5" />, roles: ['ADMIN', 'SALES_MANAGER', 'SALES_MEMBER'] },
    ],
  },
];

export const getVisibleMenuItems = (userRole: UserRole): MenuItem[] => {
  return menuConfig.flatMap(section =>
    section.items.filter(item => item.roles.includes(userRole))
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/navigation/menuConfig.tsx
git commit -m "feat(navigation): add centralized menu config by role"
```

---

## Task 5: Create RoleGuard Component

**Files:**
- Create: `frontend/src/navigation/roleGuard.tsx`

- [ ] **Step 1: Create roleGuard.tsx**

```typescript
import { useAuthStore, ROLES } from '../store/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function RoleGuard({ children, roles }: ProtectedRouteProps) {
  const hasRole = useAuthStore(state => state.hasRole);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  if (roles && !hasRole(roles)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/navigation/roleGuard.tsx
git commit -m "feat(navigation): add RoleGuard for role-based route protection"
```

---

## Task 6: Create Breadcrumb Component

**Files:**
- Create: `frontend/src/navigation/breadcrumb.tsx`

- [ ] **Step 1: Create breadcrumb.tsx**

```typescript
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames: Record<string, string> = {
  '': 'Dashboard',
  'users': 'Users',
  'doctors': 'Doctors',
  'interactions': 'Interactions',
  'activities': 'Activities',
};

export function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link to="/" className="text-gray-400 hover:text-gray-600">
        <Home className="w-4 h-4" />
      </Link>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const routePath = '/' + paths.slice(0, index + 1).join('/');
        const label = routeNames[path] || path;

        return (
          <span key={path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-300" />
            {isLast ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link to={routePath} className="text-gray-500 hover:text-gray-700">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/navigation/breadcrumb.tsx
git commit -m "feat(navigation): add auto-generating breadcrumb component"
```

---

## Task 7: Create Collapsible Sidebar

**Files:**
- Create: `frontend/src/components/SidebarNew.tsx`

- [ ] **Step 1: Create SidebarNew.tsx**

```typescript
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { menuConfig, getVisibleMenuItems } from '../navigation/menuConfig';

export function SidebarNew({ className = '' }: { className?: string }) {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const visibleItems = useMemo(() => {
    return user ? getVisibleMenuItems(user.role) : [];
  }, [user]);

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'} ${className}`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors z-10"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Logo Area */}
      <div className="p-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-bold">Sales Manager</h1>
        )}
      </div>

      {/* Menu Sections */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuConfig.map((section) => {
          const sectionItems = section.items.filter(item =>
            visibleItems.some(vi => vi.path === item.path)
          );

          if (sectionItems.length === 0) return null;

          return (
            <div key={section.label} className="mb-6">
              {!sidebarCollapsed && (
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {item.icon}
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SidebarNew.tsx
git commit -m "feat(navigation): add collapsible sidebar with role-based menu"
```

---

## Task 8: Create TopBar with Breadcrumb + Search Trigger

**Files:**
- Create: `frontend/src/components/TopBarNew.tsx`

- [ ] **Step 1: Create TopBarNew.tsx**

```typescript
import { Search, Bell } from 'lucide-react';
import { Breadcrumb } from '../navigation/breadcrumb';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

export function TopBarNew() {
  const { openSearchModal } = useUiStore();
  const user = useAuthStore(state => state.user);

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      {/* Left: Breadcrumb */}
      <Breadcrumb />

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-4">
        {/* Search Button */}
        <button
          onClick={openSearchModal}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">Ctrl+K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user?.fullName?.[0] || 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TopBarNew.tsx
git commit -m "feat(navigation): add TopBar with breadcrumb and search trigger"
```

---

## Task 9: Create Command Palette (Global Search)

**Files:**
- Create: `frontend/src/components/CommandPalette.tsx`

- [ ] **Step 1: Create CommandPalette.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Users, Stethoscope } from 'lucide-react';
import { useUiStore } from '../store/uiStore';

interface SearchResult {
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const searchItems: SearchResult[] = [
  { label: 'Dashboard', description: 'Go to Dashboard', icon: <FileText className="w-4 h-4" />, path: '/' },
  { label: 'Users', description: 'Manage users', icon: <Users className="w-4 h-4" />, path: '/users' },
  { label: 'Doctors', description: 'Manage doctors', icon: <Stethoscope className="w-4 h-4" />, path: '/doctors' },
  { label: 'Activities', description: 'View activities', icon: <FileText className="w-4 h-4" />, path: '/activities' },
  { label: 'Interactions', description: 'View interactions', icon: <FileText className="w-4 h-4" />, path: '/interactions' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { searchModalOpen, closeSearchModal } = useUiStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (searchModalOpen) {
          closeSearchModal();
        } else {
          useUiStore.getState().openSearchModal();
        }
      }
      if (e.key === 'Escape' && searchModalOpen) {
        closeSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, closeSearchModal]);

  useEffect(() => {
    if (searchModalOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [searchModalOpen]);

  const handleSelect = (path: string) => {
    navigate(path);
    closeSearchModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
    if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      handleSelect(filteredItems[selectedIndex].path);
    }
  };

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeSearchModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, doctors, users..."
            className="flex-1 text-lg outline-none placeholder:text-gray-400"
            autoFocus
          />
          <button
            onClick={closeSearchModal}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => handleSelect(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-400">{item.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/CommandPalette.tsx
git commit -m "feat(navigation): add command palette global search (Ctrl+K)"
```

---

## Task 10: Update MainLayout

**Files:**
- Modify: `frontend/src/layouts/MainLayout.tsx`

- [ ] **Step 1: Replace MainLayout.tsx content**

```typescript
import { Outlet } from 'react-router-dom';
import { SidebarNew } from '../components/SidebarNew';
import { TopBarNew } from '../components/TopBarNew';
import { CommandPalette } from '../components/CommandPalette';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      <SidebarNew className="flex-shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBarNew />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/layouts/MainLayout.tsx
git commit -m "feat(layout): update MainLayout with new sidebar and topbar"
```

---

## Task 11: Create DoctorDetail Page

**Files:**
- Create: `frontend/src/pages/DoctorDetail.tsx`

- [ ] **Step 1: Create DoctorDetail.tsx**

```typescript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { doctorService } from '../services/doctorService';
import { useEffect } from 'react';

type Tab = 'overview' | 'activities' | 'deals' | 'orders';

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    if (id) {
      doctorService.getById(id).then(setDoctor).catch(console.error);
    }
  }, [id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'activities', label: 'Activities' },
    { key: 'deals', label: 'Deals' },
    { key: 'orders', label: 'Orders' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/doctors')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {doctor?.name || 'Loading...'}
          </h1>
          <p className="text-slate-500">{doctor?.specialty}</p>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-0">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{doctor?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hospital</p>
                  <p className="font-medium">{doctor?.hospitalName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialty</p>
                  <p className="font-medium">{doctor?.specialty || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Potential Level</p>
                  <p className="font-medium">{doctor?.potentialLevel || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <p className="text-gray-500">Activities will be shown here</p>
          )}

          {activeTab === 'deals' && (
            <p className="text-gray-500">Deals will be shown here</p>
          )}

          {activeTab === 'orders' && (
            <p className="text-gray-500">Orders will be shown here</p>
          )}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DoctorDetail.tsx
git commit -m "feat(pages): add DoctorDetail page with tabs"
```

---

## Task 12: Create Interactions Page

**Files:**
- Create: `frontend/src/pages/Interactions.tsx`

- [ ] **Step 1: Create Interactions.tsx**

```typescript
import { Card } from '../components/common/Card';
import { Tag, MessageSquare } from 'lucide-react';

const mockInteractions = [
  { id: 1, title: 'Follow up on proposal', doctor: 'Dr. Nguyen Van A', priority: 'high', status: 'pending' },
  { id: 2, title: 'Schedule demo call', doctor: 'Dr. Tran Thi B', priority: 'medium', status: 'in_progress' },
  { id: 3, title: 'Send pricing document', doctor: 'Dr. Le Van C', priority: 'low', status: 'completed' },
];

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export function Interactions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Interactions</h1>
        <p className="text-slate-500">Manage tasks and follow-ups</p>
      </div>

      <div className="space-y-4">
        {mockInteractions.map(interaction => (
          <Card key={interaction.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-slate-800">{interaction.title}</p>
                  <p className="text-sm text-slate-500">{interaction.doctor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[interaction.priority as keyof typeof priorityColors]}`}>
                  {interaction.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  interaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                  interaction.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {interaction.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Interactions.tsx
git commit -m "feat(pages): add Interactions page with task list"
```

---

## Task 13: Create Activities Page

**Files:**
- Create: `frontend/src/pages/Activities.tsx`

- [ ] **Step 1: Create Activities.tsx**

```typescript
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Activity, Phone, MessageSquare, Users } from 'lucide-react';

const mockActivities = [
  { id: 1, type: 'call', doctor: 'Dr. Nguyen Van A', content: 'Discussed new product', time: '2 hours ago' },
  { id: 2, type: 'meeting', doctor: 'Dr. Tran Thi B', content: 'Product demo at hospital', time: '5 hours ago' },
  { id: 3, type: 'call', doctor: 'Dr. Le Van C', content: 'Follow-up on order', time: '1 day ago' },
];

const typeIcons = {
  call: <Phone className="w-4 h-4 text-green-600" />,
  meeting: <Users className="w-4 h-4 text-blue-600" />,
  message: <MessageSquare className="w-4 h-4 text-purple-600" />,
};

export function Activities() {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Activities</h1>
        <p className="text-slate-500">
          {doctorId ? `Filtered by doctor: ${doctorId}` : 'All activity timeline'}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {mockActivities.map(activity => (
            <div key={activity.id} className="relative flex gap-4">
              {/* Icon */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                {typeIcons[activity.type as keyof typeof typeIcons] || <Activity className="w-4 h-4" />}
              </div>

              {/* Content */}
              <Card className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800">{activity.doctor}</span>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
                <p className="text-sm text-slate-600">{activity.content}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Activities.tsx
git commit -m "feat(pages): add Activities page with timeline UI"
```

---

## Task 14: Create Unauthorized Page

**Files:**
- Create: `frontend/src/pages/Unauthorized.tsx`

- [ ] **Step 1: Create Unauthorized.tsx**

```typescript
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ShieldX } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <ShieldX className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
      <Link to="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Unauthorized.tsx
git commit -m "feat(pages): add Unauthorized access page"
```

---

## Task 15: Update App.tsx with Lazy Loading + Protected Routes

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Replace App.tsx with lazy loading and role-based routes**

```typescript
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { useAuthStore } from './store/authStore';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const UserDetail = lazy(() => import('./pages/UserDetail'));
const Doctors = lazy(() => import('./pages/Doctors'));
const DoctorDetail = lazy(() => import('./pages/DoctorDetail'));
const Hospitals = lazy(() => import('./pages/Hospitals'));
const Interactions = lazy(() => import('./pages/Interactions'));
const Activities = lazy(() => import('./pages/Activities'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Protected Route with role support
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="users/:id" element={
              <ProtectedRoute roles={['ADMIN']}>
                <UserDetail />
              </ProtectedRoute>
            } />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="hospitals" element={<Hospitals />} />
            <Route path="interactions" element={
              <ProtectedRoute roles={['ADMIN', 'SALES_MANAGER']}>
                <Interactions />
              </ProtectedRoute>
            } />
            <Route path="activities" element={<Activities />} />
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(routing): add lazy loading and role-based protected routes"
```

---

## Task 16: Verify Complete Build

- [ ] **Step 1: Build backend**

Run: `cd backend && dotnet build`
Expected: 0 Warning(s), 0 Error(s)

- [ ] **Step 2: Build frontend**

Run: `cd frontend && npm run build`
Expected: Compiles successfully

- [ ] **Step 3: Verify all features work**

Manual testing checklist:
- [ ] Dashboard loads at /
- [ ] Sidebar shows correct menu based on role
- [ ] Sidebar collapses/expands with animation
- [ ] Clicking Users navigates to /users (Admin only)
- [ ] Clicking Doctors navigates to /doctors
- [ ] Clicking Doctor row navigates to /doctors/:id with tabs
- [ ] Breadcrumb updates on navigation
- [ ] Ctrl+K opens command palette
- [ ] Command palette search works
- [ ] Activities page shows timeline
- [ ] Activities?doctorId=123 filters by doctor
- [ ] Interactions page shows task list
- [ ] Unauthorized page shows when accessing restricted route

---

## Completion Criteria

- [ ] Build succeeds with 0 warnings, 0 errors (backend and frontend)
- [ ] Role-based sidebar navigation works (menu changes based on user role)
- [ ] Lazy loading with Suspense fallback works
- [ ] Protected routes block unauthorized access
- [ ] Command palette opens with Ctrl+K
- [ ] Breadcrumb auto-generates from route
- [ ] All pages implemented: Dashboard, Users, UserDetail, Doctors, DoctorDetail, Hospitals, Interactions, Activities, Unauthorized
- [ ] Deep linking works (e.g., /doctors/:id, /activities?doctorId=xxx)
- [ ] Sidebar collapsible with animation
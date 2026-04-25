import React from 'react';
import { Bell, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </header>
  );
};
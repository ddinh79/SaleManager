import { Bell, Search } from 'lucide-react';
import { Breadcrumb } from '../navigation/breadcrumb';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

export const TopBarNew: React.FC = () => {
  const openSearchModal = useUiStore((state) => state.openSearchModal);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        <button
          onClick={openSearchModal}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs text-slate-400">Ctrl+K</span>
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{user?.fullName ?? 'User'}</p>
            <p className="text-xs text-slate-500">{user?.role ?? ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
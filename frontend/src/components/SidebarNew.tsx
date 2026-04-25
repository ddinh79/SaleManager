import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { menuConfig, getVisibleMenuItems } from '../navigation/menuConfig';
import type { MenuItem } from '../navigation/menuConfig';

interface SidebarNewProps {
  className?: string;
}

export const SidebarNew: React.FC<SidebarNewProps> = ({ className = '' }) => {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const location = useLocation();

  const visibleItems = useMemo(() => {
    if (!user) return [];
    return getVisibleMenuItems(user.role);
  }, [user]);

  return (
<aside
      className={`
        flex flex-col h-full bg-white border-r border-slate-200
        transition-[width] duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
        ${className}
      `}
    >
      {/* Logo Area */}
      <div className="relative flex items-center h-16 px-4 border-b border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-blue-600 whitespace-nowrap">
              SaleManager
            </span>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`
            absolute -right-3 top-4
            w-6 h-6 rounded-full bg-white border border-slate-200
            flex items-center justify-center
            hover:bg-slate-50 transition-colors
            ${sidebarCollapsed ? '' : 'rotate-180'}
          `}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {menuConfig.map((section) => {
          const sectionItems = section.items.filter((item: MenuItem) =>
            visibleItems.some((vis: MenuItem) => vis.path === item.path)
          );

          if (sectionItems.length === 0) return null;

          return (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.label}
                </div>
              )}
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-200
                        ${isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!sidebarCollapsed && (
                        <span className="font-medium truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
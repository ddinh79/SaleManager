import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { menuConfig, getVisibleMenuItems } from '../navigation/menuConfig';
export const SidebarNew = ({ className = '' }) => {
    const { user } = useAuthStore();
    const { sidebarCollapsed, toggleSidebar } = useUiStore();
    const location = useLocation();
    const visibleItems = useMemo(() => {
        if (!user)
            return [];
        return getVisibleMenuItems(user.role);
    }, [user]);
    return (_jsxs("aside", { className: `
        flex flex-col h-full bg-white border-r border-slate-200
        transition-[width] duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
        ${className}
      `, children: [_jsxs("div", { className: "relative flex items-center h-16 px-4 border-b border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-3 overflow-hidden", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-white font-bold text-sm", children: "SM" }) }), !sidebarCollapsed && (_jsx("span", { className: "font-bold text-blue-600 whitespace-nowrap", children: "SaleManager" }))] }), _jsx("button", { onClick: toggleSidebar, className: `
            absolute -right-3 top-4
            w-6 h-6 rounded-full bg-white border border-slate-200
            flex items-center justify-center
            hover:bg-slate-50 transition-colors
            ${sidebarCollapsed ? '' : 'rotate-180'}
          `, title: sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar', children: sidebarCollapsed ? (_jsx(ChevronRight, { className: "w-4 h-4 text-slate-600" })) : (_jsx(ChevronLeft, { className: "w-4 h-4 text-slate-600" })) })] }), _jsx("nav", { className: "flex-1 p-2 overflow-y-auto", children: menuConfig.map((section) => {
                    const sectionItems = section.items.filter((item) => visibleItems.some((vis) => vis.path === item.path));
                    if (sectionItems.length === 0)
                        return null;
                    return (_jsxs("div", { className: "mb-4", children: [!sidebarCollapsed && (_jsx("div", { className: "px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider", children: section.label })), _jsx("div", { className: "space-y-1", children: sectionItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (_jsxs(Link, { to: item.path, title: sidebarCollapsed ? item.label : undefined, className: `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-200
                        ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'}
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `, children: [_jsx("span", { className: "flex-shrink-0", children: item.icon }), !sidebarCollapsed && (_jsx("span", { className: "font-medium truncate", children: item.label }))] }, item.path));
                                }) })] }, section.label));
                }) })] }));
};

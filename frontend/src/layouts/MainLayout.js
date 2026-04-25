import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { SidebarNew } from '../components/SidebarNew';
import { TopBarNew } from '../components/TopBarNew';
import { CommandPalette } from '../components/CommandPalette';
export const MainLayout = () => {
    return (_jsxs("div", { className: "flex h-screen bg-slate-50", children: [_jsx(SidebarNew, { className: "flex-shrink-0" }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(TopBarNew, {}), _jsx("main", { className: "flex-1 overflow-auto p-6", children: _jsx(Outlet, {}) })] }), _jsx(CommandPalette, {})] }));
};

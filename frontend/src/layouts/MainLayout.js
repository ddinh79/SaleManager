import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { TopBar } from '../components/common/TopBar';
export const MainLayout = () => {
    return (_jsxs("div", { className: "flex h-screen bg-slate-50", children: [_jsx(Sidebar, { className: "w-60 flex-shrink-0" }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(TopBar, {}), _jsx("main", { className: "flex-1 overflow-auto p-6", children: _jsx(Outlet, {}) })] })] }));
};

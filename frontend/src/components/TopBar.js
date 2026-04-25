import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell, Search } from 'lucide-react';
export const TopBar = ({ title }) => {
    return (_jsxs("header", { className: "h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6", children: [_jsx("div", { className: "flex items-center gap-4", children: title && _jsx("h2", { className: "text-lg font-semibold text-slate-800", children: title }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { className: "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors", children: _jsx(Search, { className: "w-5 h-5" }) }), _jsxs("button", { className: "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative", children: [_jsx(Bell, { className: "w-5 h-5" }), _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" })] })] })] }));
};

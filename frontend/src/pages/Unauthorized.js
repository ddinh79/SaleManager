import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
export const Unauthorized = () => {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-100", children: _jsxs("div", { className: "text-center", children: [_jsx(ShieldX, { className: "w-16 h-16 text-red-500 mx-auto mb-4" }), _jsx("h1", { className: "text-2xl font-bold text-slate-800 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-slate-500 mb-6", children: "You don't have permission to access this page." }), _jsx(Link, { to: "/", className: "inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium", children: "Go to Dashboard" })] }) }));
};

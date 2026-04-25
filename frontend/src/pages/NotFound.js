import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Home } from 'lucide-react';
export const NotFound = () => {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-100", children: _jsxs(Card, { className: "w-full max-w-md p-8 text-center", children: [_jsx("div", { className: "text-6xl font-bold text-blue-600 mb-4", children: "404" }), _jsx("h1", { className: "text-2xl font-bold text-slate-800 mb-2", children: "Page Not Found" }), _jsx("p", { className: "text-slate-500 mb-6", children: "The page you're looking for doesn't exist or has been moved." }), _jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium", children: [_jsx(Home, { className: "w-4 h-4" }), "Back to Dashboard"] })] }) }));
};

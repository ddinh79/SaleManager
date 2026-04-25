import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};
export const Modal = ({ isOpen, onClose, title, children, size = 'md', }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/50", onClick: onClose }), _jsxs("div", { className: `
          relative bg-white rounded-xl shadow-xl w-full mx-4
          ${sizeStyles[size]}
        `, children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-200", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900", children: title }), _jsx("button", { onClick: onClose, className: "p-1 rounded-lg hover:bg-slate-100 transition-colors", children: _jsx(X, { className: "w-5 h-5 text-slate-500" }) })] }), _jsx("div", { className: "px-6 py-4", children: children })] })] }));
};

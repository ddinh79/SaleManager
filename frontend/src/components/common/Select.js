import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Select = forwardRef(({ label, error, options, className = '', ...props }, ref) => {
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [label && (_jsx("label", { className: "text-sm font-medium text-slate-700", children: label })), _jsx("select", { ref: ref, className: `
            px-3 py-2 rounded-lg border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-slate-300'}
            ${className}
          `, ...props, children: options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), error && _jsx("span", { className: "text-sm text-red-500", children: error })] }));
});
Select.displayName = 'Select';

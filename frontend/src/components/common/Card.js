import { jsx as _jsx } from "react/jsx-runtime";
export const Card = ({ children, className = '' }) => {
    return (_jsx("div", { className: `
        bg-white rounded-xl shadow-sm border border-slate-200
        ${className}
      `, children: children }));
};

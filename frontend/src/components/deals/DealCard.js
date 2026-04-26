import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const DealCard = ({ deal, onClick, isDragging }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'No date';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };
    const isLocked = deal.stage === 'WON' || deal.stage === 'LOST';
    return (_jsx("div", { onClick: onClick, className: `
        bg-white rounded-lg border border-slate-200 p-3 cursor-pointer
        hover:shadow-md transition-shadow
        ${isDragging ? 'shadow-xl rotate-2' : ''}
        ${isLocked ? 'opacity-75' : ''}
      `, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-slate-800 truncate", children: deal.doctorName }), _jsx("p", { className: "text-sm font-semibold text-slate-700 mt-1", children: formatCurrency(deal.totalValue) }), _jsxs("div", { className: "flex items-center gap-2 mt-2 text-xs text-slate-500", children: [_jsx("span", { children: formatDate(deal.expectedCloseDate) }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [deal.probability, "%"] })] })] }), isLocked && (_jsx("div", { className: "text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded", children: deal.stage === 'WON' ? '✓ Won' : '✗ Lost' }))] }) }));
};

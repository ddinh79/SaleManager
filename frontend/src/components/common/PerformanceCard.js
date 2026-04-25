import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getPerformanceLevel, getPerformanceColor } from '../../types/kpi';
export function PerformanceCard({ title, value, subtitle, kpi, metric }) {
    let bgColor = 'bg-white';
    let borderColor = 'border-gray-200';
    if (kpi && metric) {
        const level = getPerformanceLevel(kpi.conversionRate);
        bgColor = getPerformanceColor(level).split(' ')[1];
        borderColor = getPerformanceColor(level).split(' ')[0].replace('text-', 'border-');
    }
    return (_jsxs("div", { className: `rounded-lg border ${borderColor} ${bgColor} p-4 transition-all`, children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: title }), _jsx("p", { className: "mt-1 text-2xl font-semibold text-gray-900", children: value }), subtitle && _jsx("p", { className: "mt-1 text-xs text-gray-400", children: subtitle })] }));
}

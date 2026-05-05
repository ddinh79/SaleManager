import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTasks } from '../hooks/useTasks';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
const filterTabs = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'OVERDUE', label: 'Quá hạn' },
    { value: 'CLOSING_SOON', label: 'Sắp đóng' },
    { value: 'TODAY', label: 'Hôm nay' },
];
function getTaskColor(task) {
    if (task.overdueDays > 0)
        return 'border-l-red-500 bg-red-50';
    if (task.type === 'DEAL_CLOSING') {
        if (task.overdueDays >= -1)
            return 'border-l-orange-500 bg-orange-50';
        return 'border-l-yellow-500 bg-yellow-50';
    }
    return 'border-l-blue-500 bg-white';
}
function getTaskIcon(task) {
    if (task.overdueDays > 0)
        return _jsx(AlertCircle, { className: "w-5 h-5 text-red-500" });
    if (task.type === 'DEAL_CLOSING')
        return _jsx(Clock, { className: "w-5 h-5 text-orange-500" });
    return _jsx(CheckCircle, { className: "w-5 h-5 text-blue-500" });
}
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}
function TaskCard({ task, onSnooze, onComplete }) {
    return (_jsx("div", { className: `border-l-4 ${getTaskColor(task)} rounded-lg shadow-sm p-4 mb-3`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getTaskIcon(task), _jsx("h3", { className: "font-semibold text-slate-800", children: task.doctorName })] }), _jsx("p", { className: "text-sm text-slate-500", children: task.hospitalName }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsxs("span", { className: `text-xs px-2 py-1 rounded-full font-medium ${task.overdueDays > 0 ? 'bg-red-100 text-red-700' :
                                        task.type === 'DEAL_CLOSING' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'}`, children: [task.type === 'DEAL_OVERDUE' && `Quá hạn ${task.overdueDays} ngày`, task.type === 'DEAL_CLOSING' && (task.overdueDays >= 0 ? `Đóng trong ${task.overdueDays} ngày` : `Đóng trong ${Math.abs(task.overdueDays)} ngày`), task.type === 'FOLLOW_UP' && 'Follow-up hôm nay'] }), task.dealValue && (_jsxs("span", { className: "text-xs font-medium text-slate-600", children: ["\uD83D\uDCB0 ", formatCurrency(task.dealValue)] })), task.dealStage && (_jsx("span", { className: "text-xs text-slate-500", children: task.dealStage }))] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => onComplete(), className: "p-2 text-green-600 hover:bg-green-100 rounded-lg", title: "Ho\u00E0n th\u00E0nh", children: _jsx(CheckCircle, { className: "w-5 h-5" }) }), _jsxs("div", { className: "relative group", children: [_jsx("button", { className: "p-2 text-slate-600 hover:bg-slate-100 rounded-lg", title: "T\u1EA1m ho\u00E3n", children: _jsx(Clock, { className: "w-5 h-5" }) }), _jsxs("div", { className: "hidden group-hover:block absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border p-2 z-10 min-w-[120px]", children: [_jsx("button", { onClick: () => onSnooze(1), className: "block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded", children: "1 ng\u00E0y" }), _jsx("button", { onClick: () => onSnooze(3), className: "block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded", children: "3 ng\u00E0y" }), _jsx("button", { onClick: () => onSnooze(7), className: "block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded", children: "7 ng\u00E0y" })] })] })] })] }) }));
}
export const Tasks = () => {
    const { tasks, summary, loading, error, filter, setFilter, snooze, complete } = useTasks();
    if (loading) {
        return _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("span", { className: "text-slate-500", children: "\u0110ang t\u1EA3i..." }) });
    }
    if (error) {
        return _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("span", { className: "text-red-500", children: error }) });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "C\u00F4ng vi\u1EC7c" }), _jsx("p", { className: "text-slate-500", children: "Danh s\u00E1ch c\u00F4ng vi\u1EC7c \u01B0u ti\u00EAn" })] }), summary && (_jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { className: "text-red-600", children: ["\u26A0\uFE0F ", summary.overdue, " qu\u00E1 h\u1EA1n"] }), _jsxs("span", { className: "text-orange-600", children: ["\u23F0 ", summary.closingSoon, " s\u1EAFp \u0111\u00F3ng"] }), _jsxs("span", { className: "text-blue-600", children: ["\uD83D\uDCCB ", summary.total, " t\u1ED5ng c\u1ED9ng"] })] }))] }), _jsx("div", { className: "flex gap-2 border-b border-slate-200 pb-2", children: filterTabs.map(tab => (_jsx("button", { onClick: () => setFilter(tab.value), className: `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${filter === tab.value
                        ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                        : 'text-slate-500 hover:text-slate-700'}`, children: tab.label }, tab.value))) }), _jsx("div", { className: "space-y-3", children: tasks.length === 0 ? (_jsx("div", { className: "text-center py-12 text-slate-500", children: "Kh\u00F4ng c\u00F3 c\u00F4ng vi\u1EC7c n\u00E0o" })) : (tasks.map(task => (_jsx(TaskCard, { task: task, onSnooze: (days) => snooze(task.id, task.type, days), onComplete: () => complete(task.id, task.type) }, `${task.type}-${task.id}`)))) })] }));
};

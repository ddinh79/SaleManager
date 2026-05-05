import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDailyPlan } from '../hooks/useDailyPlan';
import { Clock, AlertCircle, CheckCircle, MessageCircle, Phone } from 'lucide-react';
const categoryColors = {
    MUST_DO: 'border-l-red-500 bg-red-50',
    SHOULD_DO: 'border-l-yellow-500 bg-yellow-50',
    NICE_TO_HAVE: 'border-l-blue-500 bg-white',
};
const statusIcons = {
    PENDING: _jsx(Clock, { className: "w-5 h-5 text-slate-400" }),
    IN_PROGRESS: _jsx(Phone, { className: "w-5 h-5 text-blue-500" }),
    COMPLETED_AUTO: _jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }),
    COMPLETED_MANUAL: _jsx(AlertCircle, { className: "w-5 h-5 text-orange-500" }),
    SKIPPED: _jsx(MessageCircle, { className: "w-5 h-5 text-slate-400" }),
    EXPIRED: _jsx(AlertCircle, { className: "w-5 h-5 text-red-500" }),
    OFF_TRACK: _jsx(AlertCircle, { className: "w-5 h-5 text-red-500" }),
};
function formatTime(date) {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}
function TaskCard({ task, isActive, onActivate, onComplete, onSkip }) {
    const isCompleted = task.status.startsWith('COMPLETED') || task.status === 'SKIPPED';
    return (_jsx("div", { className: `border-l-4 ${categoryColors[task.category]} rounded-lg shadow-sm p-4 mb-3 ${isActive ? 'ring-2 ring-blue-500' : ''}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [statusIcons[task.status] || statusIcons.PENDING, task.plannedStart && (_jsx("span", { className: "text-sm font-medium text-slate-600", children: formatTime(task.plannedStart) })), _jsxs("h3", { className: `font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`, children: [task.taskType === 'CALL' && '📞 ', task.taskType === 'MEETING' && '🤝 ', task.taskType === 'FOLLOW_UP' && '📋 ', task.taskType === 'MESSAGE' && '💬 ', task.doctorName] })] }), _jsx("p", { className: "text-sm text-slate-500", children: task.hospitalName }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [task.dealValue && (_jsxs("span", { className: "text-xs font-medium text-slate-600", children: ["\uD83D\uDCB0 ", formatCurrency(task.dealValue)] })), task.temperature && (_jsx("span", { className: `text-xs px-2 py-1 rounded-full ${task.temperature === 'HOT' ? 'bg-red-100 text-red-700' :
                                        task.temperature === 'WARM' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-slate-100 text-slate-700'}`, children: task.temperature })), task.isLowConfidence && (_jsx("span", { className: "text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700", children: "\u26A0\uFE0F Manual" }))] })] }), !isCompleted && (_jsxs("div", { className: "flex gap-2", children: [!isActive && (_jsx("button", { onClick: onActivate, className: "p-2 text-blue-600 hover:bg-blue-100 rounded-lg", title: "Start", children: "\u25B6" })), _jsx("button", { onClick: onComplete, className: "p-2 text-green-600 hover:bg-green-100 rounded-lg", title: "Complete", children: _jsx(CheckCircle, { className: "w-5 h-5" }) }), _jsx("button", { onClick: onSkip, className: "p-2 text-slate-600 hover:bg-slate-100 rounded-lg", title: "Skip", children: _jsx(Clock, { className: "w-5 h-5" }) })] }))] }) }));
}
export const DailyPlan = () => {
    const { plan, loading, error, completeTask, skipTask, activateTask } = useDailyPlan();
    if (loading) {
        return _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("span", { className: "text-slate-500", children: "\u0110ang t\u1EA3i..." }) });
    }
    if (error) {
        return _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("span", { className: "text-red-500", children: error }) });
    }
    if (!plan) {
        return _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("span", { className: "text-slate-500", children: "Kh\u00F4ng c\u00F3 k\u1EBF ho\u1EA1ch" }) });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "\uD83D\uDCC5 K\u1EBF ho\u1EA1ch h\u00F4m nay" }), _jsx("p", { className: "text-slate-500", children: new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' }) })] }), _jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { className: `px-3 py-1 rounded-full ${plan.isRecoveryMode ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`, children: [plan.capacity.mode, " Mode"] }), _jsxs("span", { className: "text-slate-600", children: ["\uD83D\uDCCA Confidence: ", Math.round(plan.confidenceScore * 100), "%"] })] })] }), plan.status === 'OFF_TRACK' && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: ["\u26A0\uFE0F K\u1EBF ho\u1EA1ch b\u1ECB tr\u1EC5 (", plan.mustDo.filter(t => t.delayMinutes > 0).length, " task)"] })), plan.mustDo.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2", children: ["\uD83D\uDD25 MUST DO", _jsxs("span", { className: "text-sm font-normal text-slate-500", children: [plan.capacity.mustDoLimit, " tasks"] })] }), _jsx("div", { children: plan.mustDo.map(task => (_jsx(TaskCard, { task: task, isActive: plan.activeTaskId === task.id, onActivate: () => activateTask(task.id), onComplete: () => completeTask(task.id, { reasonCode: 'COMPLETED' }), onSkip: () => skipTask(task.id, { reasonCode: 'SKIPPED' }) }, task.id))) })] })), plan.shouldDo.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2", children: ["\u26A1 SHOULD DO", _jsxs("span", { className: "text-sm font-normal text-slate-500", children: [plan.capacity.shouldDoLimit, " tasks"] })] }), _jsx("div", { children: plan.shouldDo.map(task => (_jsx(TaskCard, { task: task, isActive: plan.activeTaskId === task.id, onActivate: () => activateTask(task.id), onComplete: () => completeTask(task.id, { reasonCode: 'COMPLETED' }), onSkip: () => skipTask(task.id, { reasonCode: 'SKIPPED' }) }, task.id))) })] })), plan.niceToHave.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2", children: "\uD83E\uDDCA LATER" }), _jsx("div", { children: plan.niceToHave.map(task => (_jsx(TaskCard, { task: task, isActive: plan.activeTaskId === task.id, onActivate: () => activateTask(task.id), onComplete: () => completeTask(task.id, { reasonCode: 'COMPLETED' }), onSkip: () => skipTask(task.id, { reasonCode: 'SKIPPED' }) }, task.id))) })] }))] }));
};
export default DailyPlan;

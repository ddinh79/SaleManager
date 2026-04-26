import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';
const ManagerDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        dashboardService.getManagerDashboard()
            .then((res) => {
            setData(res.data);
            setLoading(false);
        })
            .catch((err) => {
            console.error('Failed to load manager dashboard:', err);
            setLoading(false);
        });
    }, []);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-slate-500", children: "Loading..." }) }));
    }
    if (!data) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-slate-500", children: "No data available" }) }));
    }
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Manager Dashboard" }), _jsx("p", { className: "text-slate-500", children: "Team performance overview" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Team Size" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: data.teamSize })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Team Pipeline" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: formatCurrency(data.teamPipelineValue) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Weighted Forecast" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: formatCurrency(data.teamWeightedForecast) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Closing This Month" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: data.dealsClosingThisMonth })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Inactive Sales Members (5+ days)" }), data.inactiveSalesMembers.length === 0 ? (_jsx("div", { className: "text-slate-500", children: "No inactive members" })) : (_jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200", children: [_jsx("th", { className: "text-left py-3 text-sm font-medium text-slate-600", children: "Name" }), _jsx("th", { className: "text-left py-3 text-sm font-medium text-slate-600", children: "Last Activity" }), _jsx("th", { className: "text-left py-3 text-sm font-medium text-slate-600", children: "Days Inactive" })] }) }), _jsx("tbody", { children: data.inactiveSalesMembers.map((member) => (_jsxs("tr", { className: "border-b border-slate-100", children: [_jsx("td", { className: "py-3 text-slate-700", children: member.name }), _jsx("td", { className: "py-3 text-slate-700", children: new Date(member.lastActivity).toLocaleDateString() }), _jsx("td", { className: "py-3 text-slate-700", children: member.daysInactive })] }, member.id))) })] }))] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Team Performance" }), _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200", children: [_jsx("th", { className: "text-left py-3 text-sm font-medium text-slate-600", children: "Sales Person" }), _jsx("th", { className: "text-right py-3 text-sm font-medium text-slate-600", children: "Deals Won" }), _jsx("th", { className: "text-right py-3 text-sm font-medium text-slate-600", children: "Revenue" }), _jsx("th", { className: "text-right py-3 text-sm font-medium text-slate-600", children: "Tasks Completed" })] }) }), _jsx("tbody", { children: data.teamPerformance.map((item) => (_jsxs("tr", { className: "border-b border-slate-100", children: [_jsx("td", { className: "py-3 text-slate-700", children: item.salesName }), _jsx("td", { className: "py-3 text-right text-slate-700", children: item.dealsWon }), _jsx("td", { className: "py-3 text-right text-slate-700", children: formatCurrency(item.revenue) }), _jsx("td", { className: "py-3 text-right text-slate-700", children: item.tasksCompleted })] }, item.salesId))) })] })] })] }));
};
export default ManagerDashboard;

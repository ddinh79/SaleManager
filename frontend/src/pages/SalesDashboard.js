import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';
const SalesDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        dashboardService.getSalesDashboard()
            .then((data) => {
            setData(data);
            setLoading(false);
        })
            .catch((err) => {
            console.error('Failed to load sales dashboard:', err);
            setError(err.message || 'Failed to load dashboard');
            setLoading(false);
        });
    }, []);
    if (loading)
        return _jsx("div", { className: "p-6", children: "Loading..." });
    if (error)
        return _jsx("div", { className: "p-6 text-red-500", children: error });
    if (!data)
        return _jsx("div", { className: "p-6", children: "No data available" });
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "My Dashboard" }), _jsx("p", { className: "text-slate-500", children: "Your sales performance overview" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-xl border border-blue-100", children: [_jsx("div", { className: "text-sm text-blue-600 font-medium", children: "Tasks Today" }), _jsx("div", { className: "text-3xl font-bold text-blue-700", children: data.tasksToday })] }), _jsxs("div", { className: "bg-red-50 p-4 rounded-xl border border-red-100", children: [_jsx("div", { className: "text-sm text-red-600 font-medium", children: "Overdue Tasks" }), _jsx("div", { className: "text-3xl font-bold text-red-700", children: data.tasksOverdue })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("div", { className: "text-gray-500 text-sm", children: "My Deals" }), _jsx("div", { className: "text-2xl font-bold", children: data.myDeals })] }), _jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("div", { className: "text-gray-500 text-sm", children: "Pipeline Value" }), _jsx("div", { className: "text-2xl font-bold", children: formatCurrency(data.myPipelineValue) })] }), _jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("div", { className: "text-gray-500 text-sm", children: "Weighted Forecast" }), _jsx("div", { className: "text-2xl font-bold", children: formatCurrency(data.myWeightedForecast) })] })] }), _jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "My Active Deals" }), data.myDealDetails && data.myDealDetails.length > 0 ? (_jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-2", children: "Doctor" }), _jsx("th", { className: "text-left py-2", children: "Hospital" }), _jsx("th", { className: "text-right py-2", children: "Value" }), _jsx("th", { className: "text-left py-2", children: "Stage" }), _jsx("th", { className: "text-right py-2", children: "Expected Close" })] }) }), _jsx("tbody", { children: data.myDealDetails.map((deal) => (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "py-2", children: deal.doctorName }), _jsx("td", { className: "py-2", children: deal.hospitalName }), _jsx("td", { className: "py-2 text-right", children: formatCurrency(deal.totalValue) }), _jsx("td", { className: "py-2", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${deal.stage === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                    deal.stage === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'}`, children: deal.stage }) }), _jsx("td", { className: "py-2 text-right", children: new Date(deal.expectedCloseDate).toLocaleDateString() })] }, deal.dealId))) })] })) : (_jsx("div", { className: "text-gray-500", children: "No active deals" }))] }), _jsxs("div", { className: "bg-white p-4 rounded shadow mb-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "KPI Progress" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { className: "text-sm", children: "Revenue Progress" }), _jsxs("span", { className: "text-sm font-medium", children: [formatCurrency(data.kpiProgress.currentRevenue), " / ", formatCurrency(data.kpiProgress.targetRevenue)] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded", style: { width: `${Math.min(100, (data.kpiProgress.currentRevenue / data.kpiProgress.targetRevenue) * 100)}%` } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { className: "text-sm", children: "Deals Won" }), _jsxs("span", { className: "text-sm font-medium", children: [data.kpiProgress.wonDeals, " / ", data.kpiProgress.targetDeals] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded", style: { width: `${Math.min(100, (data.kpiProgress.wonDeals / data.kpiProgress.targetDeals) * 100)}%` } }) })] })] })] }), _jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Recent Activities" }), data.recentActivities.length === 0 ? (_jsx("div", { className: "text-gray-500", children: "No recent activities" })) : (_jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-2", children: "Type" }), _jsx("th", { className: "text-left py-2", children: "Doctor" }), _jsx("th", { className: "text-left py-2", children: "Date" })] }) }), _jsx("tbody", { children: data.recentActivities.map((activity) => (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "py-2", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${activity.type === 'CALL' ? 'bg-blue-100 text-blue-700' :
                                                    activity.type === 'MEETING' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'}`, children: activity.type }) }), _jsx("td", { className: "py-2", children: activity.doctorName }), _jsx("td", { className: "py-2", children: new Date(activity.createdAt).toLocaleDateString() })] }, activity.id))) })] }))] })] }));
};
export default SalesDashboard;

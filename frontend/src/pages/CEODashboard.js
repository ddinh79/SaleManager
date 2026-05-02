import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
const CEODashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        dashboardService.getCEODashboard()
            .then((data) => {
            setData(data);
            setLoading(false);
        })
            .catch((err) => {
            console.error('Failed to load CEO dashboard:', err);
            setError(err.message || 'Failed to load dashboard');
            setLoading(false);
        });
    }, []);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-slate-500", children: "Loading..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-red-500", children: error }) }));
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "CEO Dashboard" }), _jsx("p", { className: "text-slate-500", children: "Overview of sales performance" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Total Revenue" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: formatCurrency(data.totalRevenue) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Pipeline Value" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: formatCurrency(data.pipelineValue) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Weighted Forecast" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: formatCurrency(data.weightedForecast) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Conversion Rate" }), _jsxs("div", { className: "text-2xl font-bold text-slate-800", children: [data.conversionRate, "%"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Revenue by Sales" }), _jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data.revenueBySales, layout: "vertical", margin: { left: 20, right: 30 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: false }), _jsx(XAxis, { type: "number", tickFormatter: (v) => `${(v / 1000000).toFixed(0)}M` }), _jsx(YAxis, { type: "category", dataKey: "salesName", width: 100, tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Bar, { dataKey: "revenue", fill: "#3b82f6", radius: [0, 4, 4, 0], children: data.revenueBySales.map((_, index) => (_jsx(Cell, { fill: index === 0 ? '#1d4ed8' : '#3b82f6' }, index))) })] }) }) }), _jsx("div", { className: "mt-4 space-y-2", children: data.revenueBySales.map((item, index) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-slate-600", children: item.salesName }), _jsx("span", { className: "font-medium text-slate-700", children: formatCurrency(item.revenue) })] }, index))) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Top Doctors" }), _jsx("div", { className: "space-y-3", children: data.topDoctors.map((doctor) => (_jsxs("div", { className: "flex justify-between items-center border-b border-slate-100 pb-3 last-border-b-0", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-700", children: doctor.name }), _jsx("div", { className: "text-sm text-slate-500", children: doctor.hospital })] }), _jsx("div", { className: "font-semibold text-slate-700", children: formatCurrency(doctor.totalValue) })] }, doctor.id))) })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-xl border border-blue-100", children: [_jsx("div", { className: "text-sm text-blue-600 font-medium", children: "Total Deals" }), _jsx("div", { className: "text-3xl font-bold text-blue-700", children: data.totalDeals })] }), _jsxs("div", { className: "bg-green-50 p-4 rounded-xl border border-green-100", children: [_jsx("div", { className: "text-sm text-green-600 font-medium", children: "Won" }), _jsx("div", { className: "text-3xl font-bold text-green-700", children: data.wonDeals })] }), _jsxs("div", { className: "bg-yellow-50 p-4 rounded-xl border border-yellow-100", children: [_jsx("div", { className: "text-sm text-yellow-600 font-medium", children: "Active" }), _jsx("div", { className: "text-3xl font-bold text-yellow-700", children: data.activeDeals })] })] })] }));
};
export default CEODashboard;

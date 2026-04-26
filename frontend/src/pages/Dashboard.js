import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { dealService } from '../services/dealService';
import { useState, useEffect } from 'react';
const stats = [
    { label: 'Total Doctors', value: '156', icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Monthly Revenue', value: '$45,230', icon: DollarSign, color: 'text-green-600 bg-green-100' },
    { label: 'Growth Rate', value: '+12.5%', icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
    { label: 'Active Deals', value: '24', icon: Activity, color: 'text-orange-600 bg-orange-100' },
];
const recentActivities = [
    { id: 1, text: 'Dr. Nguyen Van A updated prescription data', time: '5 minutes ago' },
    { id: 2, text: 'New hospital added: City General Hospital', time: '1 hour ago' },
    { id: 3, text: 'Meeting scheduled with Dr. Tran Thi B', time: '2 hours ago' },
    { id: 4, text: 'Sales report submitted for Q1', time: '3 hours ago' },
];
const dealsClosing = [
    { id: 1, doctor: 'Dr. Le Van C', specialty: 'Cardiology', hospital: 'Heart Center', amount: '$5,000' },
    { id: 2, doctor: 'Dr. Pham Thi D', specialty: 'Orthopedics', hospital: 'Bone & Joint', amount: '$3,500' },
    { id: 3, doctor: 'Dr. Hoang Van E', specialty: 'Neurology', hospital: 'Brain Institute', amount: '$4,200' },
];
export const Dashboard = () => {
    const navigate = useNavigate();
    const [forecast, setForecast] = useState(null);
    useEffect(() => {
        loadForecast();
    }, []);
    const loadForecast = async () => {
        try {
            const data = await dealService.getForecast();
            setForecast({
                totalPipelineValue: data.totalPipelineValue,
                weightedForecast: data.weightedForecast,
            });
        }
        catch (error) {
            console.error('Failed to load forecast:', error);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Dashboard" }), _jsx("p", { className: "text-slate-500", children: "Welcome back! Here's your overview." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [stats.map((stat) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `p-3 rounded-lg ${stat.color}`, children: _jsx(stat.icon, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500", children: stat.label }), _jsx("p", { className: "text-2xl font-bold text-slate-800", children: stat.value })] })] }) }, stat.label))), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm text-slate-500 mb-1", children: "Pipeline Value" }), _jsx("div", { className: "text-2xl font-bold text-slate-800", children: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(forecast?.totalPipelineValue || 0) }), _jsxs("div", { className: "text-xs text-slate-500 mt-1", children: ["Weighted: ", new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(forecast?.weightedForecast || 0)] })] })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800", children: "Team Members" }), _jsx("p", { className: "text-sm text-slate-500", children: "Manage your sales team and view performance" })] }), _jsxs(Button, { onClick: () => navigate('/users'), children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "View Users"] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Recent Activities" }), _jsx("div", { className: "space-y-3", children: recentActivities.map((activity) => (_jsxs("div", { className: "flex items-start gap-3 p-3 bg-slate-50 rounded-lg", children: [_jsx("div", { className: "w-2 h-2 mt-2 rounded-full bg-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-700", children: activity.text }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: activity.time })] })] }, activity.id))) })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Deals Closing Soon" }), _jsx("div", { className: "space-y-3", children: dealsClosing.map((deal) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-slate-700", children: deal.doctor }), _jsxs("p", { className: "text-sm text-slate-500", children: [deal.specialty, " \u2022 ", deal.hospital] })] }), _jsx("span", { className: "font-semibold text-green-600", children: deal.amount })] }, deal.id))) })] })] })] }));
};

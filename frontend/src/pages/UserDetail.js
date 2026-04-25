import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin } from 'lucide-react';
import { userService } from '../services/userService';
import { RoleBadge } from '../components/common/RoleBadge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PerformanceCard } from '../components/common/PerformanceCard';
import api from '../services/api';
export function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [kpi, setKpi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    useEffect(() => {
        if (id)
            loadUserData(id);
    }, [id]);
    const loadUserData = async (userId) => {
        setLoading(true);
        try {
            const [userData, kpiData] = await Promise.all([
                userService.getById(userId),
                api.get(`/kpi/users/${userId}/summary`).then(res => res.data).catch(() => null),
            ]);
            setUser(userData);
            setKpi(kpiData);
        }
        catch (error) {
            console.error('Failed to load user:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return _jsx("div", { className: "p-6", children: "Loading..." });
    }
    if (!user) {
        return _jsx("div", { className: "p-6", children: "User not found" });
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx(Button, { variant: "ghost", onClick: () => navigate('/users'), children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsx("div", { className: "flex-1", children: _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: user.fullName }) }), _jsxs(Button, { variant: "secondary", onClick: () => { }, children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Edit"] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-1", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex flex-col items-center pb-6 border-b border-gray-200", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4", children: user.avatarUrl ? (_jsx("img", { src: user.avatarUrl, alt: user.fullName, className: "w-full h-full object-cover" })) : (_jsx("span", { className: "text-2xl font-medium text-gray-500", children: user.fullName[0] })) }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: user.fullName }), _jsx("div", { className: "mt-2", children: _jsx(RoleBadge, { role: user.role, size: "md" }) }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: user.email })] }), _jsxs("div", { className: "pt-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Mail, { className: "w-4 h-4" }), user.email] }), user.phone && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Phone, { className: "w-4 h-4" }), user.phone] })), user.managerName && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(MapPin, { className: "w-4 h-4" }), "Manager: ", user.managerName] }))] })] }), kpi && (_jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [_jsx(PerformanceCard, { title: "Calls", value: kpi.totalCalls, subtitle: "Last 30 days", kpi: kpi, metric: "calls" }), _jsx(PerformanceCard, { title: "Meetings", value: kpi.totalMeetings, subtitle: "Last 30 days", kpi: kpi, metric: "meetings" }), _jsx(PerformanceCard, { title: "Revenue", value: `$${kpi.totalRevenue.toLocaleString()}`, subtitle: "Last 30 days", kpi: kpi, metric: "revenue" }), _jsx(PerformanceCard, { title: "Conversion", value: `${kpi.conversionRate}%`, subtitle: `${kpi.wonDeals}/${kpi.totalDeals} deals`, kpi: kpi, metric: "conversion" })] }))] }), _jsx("div", { className: "lg:col-span-2", children: _jsxs(Card, { children: [_jsx("div", { className: "flex border-b border-gray-200 mb-4", children: ['profile', 'kpi', 'doctors', 'activities'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: tab.charAt(0).toUpperCase() + tab.slice(1) }, tab))) }), activeTab === 'profile' && (_jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Username" }), _jsx("p", { className: "font-medium", children: user.username })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Role" }), _jsx(RoleBadge, { role: user.role })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Created" }), _jsx("p", { className: "font-medium", children: new Date(user.createdAt).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Status" }), _jsx("p", { className: `font-medium ${user.isActive ? 'text-green-600' : 'text-gray-600'}`, children: user.isActive ? 'Active' : 'Inactive' })] })] }) })), activeTab === 'kpi' && kpi && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-3", children: "Performance Overview" }), _jsxs("div", { className: "grid grid-cols-4 gap-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: kpi.totalCalls }), _jsx("p", { className: "text-sm text-gray-500", children: "Total Calls" })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: kpi.totalMeetings }), _jsx("p", { className: "text-sm text-gray-500", children: "Total Meetings" })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: kpi.totalDeals }), _jsx("p", { className: "text-sm text-gray-500", children: "Total Deals" })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: kpi.wonDeals }), _jsx("p", { className: "text-sm text-gray-500", children: "Won Deals" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-green-50 rounded-lg border border-green-200", children: [_jsx("p", { className: "text-sm text-green-600", children: "Won" }), _jsx("p", { className: "text-3xl font-bold text-green-700", children: kpi.wonDeals })] }), _jsxs("div", { className: "p-4 bg-red-50 rounded-lg border border-red-200", children: [_jsx("p", { className: "text-sm text-red-600", children: "Lost" }), _jsx("p", { className: "text-3xl font-bold text-red-700", children: kpi.lostDeals })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Activity Score" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: kpi.activityScore }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "(calls \u00D7 1) + (meetings \u00D7 3) + (won \u00D7 5)" })] })] })), activeTab === 'kpi' && !kpi && (_jsx("p", { className: "text-gray-500", children: "No KPI data available" })), activeTab === 'doctors' && (_jsx("p", { className: "text-gray-500", children: "Assigned doctors will be shown here" })), activeTab === 'activities' && (_jsx("p", { className: "text-gray-500", children: "Activity history will be shown here" }))] }) })] })] }));
}

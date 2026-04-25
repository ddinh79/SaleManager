import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Activity, Phone, MessageSquare, Users } from 'lucide-react';
const mockActivities = [
    { id: 1, type: 'call', doctor: 'Dr. Nguyen Van A', content: 'Discussed new product', time: '2 hours ago' },
    { id: 2, type: 'meeting', doctor: 'Dr. Tran Thi B', content: 'Product demo at hospital', time: '5 hours ago' },
    { id: 3, type: 'call', doctor: 'Dr. Le Van C', content: 'Follow-up on order', time: '1 day ago' },
];
const typeIcons = {
    call: _jsx(Phone, { className: "w-4 h-4 text-green-600" }),
    meeting: _jsx(Users, { className: "w-4 h-4 text-blue-600" }),
    message: _jsx(MessageSquare, { className: "w-4 h-4 text-purple-600" }),
};
export function Activities() {
    const [searchParams] = useSearchParams();
    const doctorId = searchParams.get('doctorId');
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Activities" }), _jsx("p", { className: "text-slate-500", children: doctorId ? `Filtered by doctor: ${doctorId}` : 'All activity timeline' })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" }), _jsx("div", { className: "space-y-6", children: mockActivities.map(activity => (_jsxs("div", { className: "relative flex gap-4", children: [_jsx("div", { className: "relative z-10 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center", children: typeIcons[activity.type] || _jsx(Activity, { className: "w-4 h-4" }) }), _jsxs(Card, { className: "flex-1 p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-800", children: activity.doctor }), _jsx("span", { className: "text-xs text-gray-400", children: activity.time })] }), _jsx("p", { className: "text-sm text-slate-600", children: activity.content })] })] }, activity.id))) })] })] }));
}

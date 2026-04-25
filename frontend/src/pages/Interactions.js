import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MessageSquare } from 'lucide-react';
import { Card } from '../components/common/Card';
const mockInteractions = [
    { id: 1, title: 'Discussed new product features', doctor: 'Dr. Smith', priority: 'high', status: 'completed' },
    { id: 2, title: 'Follow-up on prescription', doctor: 'Dr. Johnson', priority: 'medium', status: 'in_progress' },
    { id: 3, title: 'Product inquiry', doctor: 'Dr. Williams', priority: 'low', status: 'pending' },
    { id: 4, title: 'Sample request follow-up', doctor: 'Dr. Brown', priority: 'medium', status: 'in_progress' },
    { id: 5, title: 'Lunch and learn scheduling', doctor: 'Dr. Davis', priority: 'high', status: 'pending' },
];
const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
};
const statusColors = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800',
};
export const Interactions = () => {
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-6", children: [_jsx(MessageSquare, { className: "w-6 h-6 text-slate-600" }), _jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Interactions" })] }), _jsx("div", { className: "grid gap-4", children: mockInteractions.map((interaction) => (_jsx(Card, { children: _jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-slate-500", children: ["#", interaction.id] }), _jsx("span", { className: `text-sm font-medium ${priorityColors[interaction.priority]}`, children: interaction.priority.toUpperCase() })] }), _jsx("h3", { className: "text-lg font-medium text-slate-800 mb-1", children: interaction.title }), _jsxs("p", { className: "text-sm text-slate-500", children: ["Doctor: ", interaction.doctor] })] }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${statusColors[interaction.status]}`, children: interaction.status.replace('_', ' ') })] }) }) }, interaction.id))) })] }));
};

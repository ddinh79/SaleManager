import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { taskService } from '../services/taskService';
const temperatureColors = {
    HOT: 'bg-red-100 text-red-700',
    WARM: 'bg-yellow-100 text-yellow-700',
    COLD: 'bg-gray-100 text-gray-500',
};
const temperatureEmoji = {
    HOT: '🔥',
    WARM: '🌤',
    COLD: '❄️',
};
export function Tasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snoozeOpen, setSnoozeOpen] = useState(null);
    const [tempOpen, setTempOpen] = useState(null);
    useEffect(() => {
        loadTasks();
    }, []);
    const loadTasks = async () => {
        try {
            const data = await taskService.getTodayTasks();
            setTasks(data);
        }
        catch (error) {
            console.error('Failed to load tasks:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleLogActivity = (doctorId) => {
        navigate(`/activities?doctorId=${doctorId}`);
    };
    const handleTemperatureChange = async (doctorId, temp) => {
        try {
            await taskService.updateTemperature(doctorId, temp);
            setTempOpen(null);
            loadTasks();
        }
        catch (error) {
            console.error('Failed to update temperature:', error);
        }
    };
    const handleSnooze = async (doctorId, days) => {
        try {
            await taskService.snooze(doctorId, days);
            setSnoozeOpen(null);
            loadTasks();
        }
        catch (error) {
            console.error('Failed to snooze:', error);
        }
    };
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const getLastActivityText = (task) => {
        if (!task.lastActivityAt)
            return 'No activity yet';
        const days = Math.floor((Date.now() - new Date(task.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0)
            return 'Today';
        if (days === 1)
            return 'Yesterday';
        return `${days} days ago`;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Today's Tasks" }), _jsxs("span", { className: "text-sm text-gray-500", children: [tasks.length, " tasks"] })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : tasks.length === 0 ? (_jsx(Card, { className: "p-8 text-center", children: _jsx("p", { className: "text-gray-500", children: "No tasks for today. Enjoy your day!" }) })) : (_jsx("div", { className: "space-y-3", children: tasks.map((task) => (_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center", children: _jsx("span", { className: "text-xl", children: temperatureEmoji[task.temperature] }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-medium text-slate-800", children: task.doctorName }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${temperatureColors[task.temperature]}`, children: task.temperature }), task.isOverdue && (_jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700", children: "OVERDUE" }))] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Last: ", task.lastActivityType ? `${task.lastActivityType} ` : '', getLastActivityText(task)] }), _jsxs("p", { className: "text-sm text-gray-400", children: ["Next: ", formatDate(task.nextFollowUpAt)] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", onClick: () => handleLogActivity(task.doctorId), children: "Log Activity" }), _jsxs("div", { className: "relative", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => setTempOpen(tempOpen === task.doctorId ? null : task.doctorId), children: "Temp \u25BE" }), tempOpen === task.doctorId && (_jsxs("div", { className: "absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10", children: [_jsx("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-100", onClick: () => handleTemperatureChange(task.doctorId, 'HOT'), children: "\uD83D\uDD25 Hot" }), _jsx("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-100", onClick: () => handleTemperatureChange(task.doctorId, 'WARM'), children: "\uD83C\uDF24 Warm" }), _jsx("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-100", onClick: () => handleTemperatureChange(task.doctorId, 'COLD'), children: "\u2744\uFE0F Cold" })] }))] }), _jsxs("div", { className: "relative", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => setSnoozeOpen(snoozeOpen === task.doctorId ? null : task.doctorId), children: "Snooze \u25BE" }), snoozeOpen === task.doctorId && (_jsxs("div", { className: "absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10", children: [_jsx("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-100", onClick: () => handleSnooze(task.doctorId, 1), children: "1 day" }), _jsx("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-100", onClick: () => handleSnooze(task.doctorId, 3), children: "3 days" }), _jsx("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-100", onClick: () => handleSnooze(task.doctorId, 7), children: "1 week" })] }))] })] })] }) }, task.doctorId))) }))] }));
}

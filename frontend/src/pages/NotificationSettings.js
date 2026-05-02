import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
const NotificationSettingsPage = () => {
    const [settings, setSettings] = useState({
        followUpReminderEnabled: true,
        dealClosingEnabled: true,
        inactiveAlertEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        notificationService.getSettings().then((res) => {
            setSettings(res);
            setLoading(false);
        });
    }, []);
    const handleToggle = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        setSaved(false);
        setSaving(true);
        try {
            await notificationService.updateSettings(newSettings);
            setSaved(true);
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "p-6", children: "Loading..." });
    return (_jsxs("div", { className: "p-6 max-w-2xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Notification Settings" }), _jsxs("div", { className: "bg-white rounded-xl shadow border border-slate-200 p-6", children: [_jsx("p", { className: "text-sm text-slate-500 mb-6", children: "Control which notifications you receive. Changes are saved automatically." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between py-3 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-slate-800", children: "Follow-up Reminders" }), _jsx("p", { className: "text-sm text-slate-500 mt-0.5", children: "Get notified when your deals have no activity for 3 days" })] }), _jsx("button", { onClick: () => handleToggle('followUpReminderEnabled'), className: `relative w-12 h-6 rounded-full transition-colors ${settings.followUpReminderEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`, children: _jsx("span", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.followUpReminderEnabled ? 'translate-x-7' : 'translate-x-1'}` }) })] }), _jsxs("div", { className: "flex items-center justify-between py-3 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-slate-800", children: "Deal Closing Alerts" }), _jsx("p", { className: "text-sm text-slate-500 mt-0.5", children: "Get notified when deals are expected to close soon" })] }), _jsx("button", { onClick: () => handleToggle('dealClosingEnabled'), className: `relative w-12 h-6 rounded-full transition-colors ${settings.dealClosingEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`, children: _jsx("span", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.dealClosingEnabled ? 'translate-x-7' : 'translate-x-1'}` }) })] }), _jsxs("div", { className: "flex items-center justify-between py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-slate-800", children: "Inactive Sales Alerts" }), _jsx("p", { className: "text-sm text-slate-500 mt-0.5", children: "Get notified when team members are inactive for 5+ days (Managers only)" })] }), _jsx("button", { onClick: () => handleToggle('inactiveAlertEnabled'), className: `relative w-12 h-6 rounded-full transition-colors ${settings.inactiveAlertEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`, children: _jsx("span", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.inactiveAlertEnabled ? 'translate-x-7' : 'translate-x-1'}` }) })] })] }), saved && _jsx("p", { className: "text-sm text-green-600 mt-4", children: "Settings saved successfully" }), saving && _jsx("p", { className: "text-sm text-slate-400 mt-4", children: "Saving..." })] })] }));
};
const NotificationSettings = NotificationSettingsPage;
export { NotificationSettings };
export default NotificationSettingsPage;

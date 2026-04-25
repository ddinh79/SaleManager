import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Phone, MessageSquare, Users, Activity as ActivityIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';
import { doctorService } from '../services/doctorService';
const typeIcons = {
    CALL: _jsx(Phone, { className: "w-4 h-4 text-green-600" }),
    MESSAGE: _jsx(MessageSquare, { className: "w-4 h-4 text-purple-600" }),
    MEETING: _jsx(Users, { className: "w-4 h-4 text-blue-600" }),
    DEMO: _jsx(ActivityIcon, { className: "w-4 h-4 text-orange-600" }),
    SAMPLE_SENT: _jsx(ActivityIcon, { className: "w-4 h-4 text-gray-600" }),
};
const gpsStatusColors = {
    VALID: 'bg-green-100 text-green-700',
    SUSPICIOUS: 'bg-yellow-100 text-yellow-700',
    MISSING: 'bg-gray-100 text-gray-500',
};
const gpsStatusLabels = {
    VALID: 'Valid',
    SUSPICIOUS: 'Suspicious',
    MISSING: 'Missing',
};
const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
const formatDateHeader = (dateKey) => {
    return new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
export function Activities() {
    const [searchParams] = useSearchParams();
    const doctorIdFromUrl = searchParams.get('doctorId');
    const { activities, selectedDoctorId, isLoading, quickAddOpen, setSelectedDoctor, setQuickAddOpen, fetchTimeline, createActivity, } = useActivityStore();
    const [doctors, setDoctors] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'CALL',
        content: '',
        result: '',
        nextFollowUpAt: '',
    });
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        doctorService.getAssignedDoctors().then(setDoctors).catch(console.error);
    }, []);
    useEffect(() => {
        if (doctorIdFromUrl) {
            setSelectedDoctor(doctorIdFromUrl);
        }
    }, [doctorIdFromUrl, setSelectedDoctor]);
    useEffect(() => {
        fetchTimeline(selectedDoctorId || undefined);
    }, [selectedDoctorId, fetchTimeline]);
    const groupedActivities = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const result = { today: [], yesterday: [], dates: {} };
        activities.forEach((activity) => {
            const activityDate = new Date(activity.createdAt);
            activityDate.setHours(0, 0, 0, 0);
            if (activityDate.getTime() === today.getTime()) {
                result.today.push(activity);
            }
            else if (activityDate.getTime() === yesterday.getTime()) {
                result.yesterday.push(activity);
            }
            else {
                const dateKey = activityDate.toISOString().split('T')[0];
                if (!result.dates[dateKey])
                    result.dates[dateKey] = [];
                result.dates[dateKey].push(activity);
            }
        });
        return result;
    }, [activities]);
    const selectedDoctor = useMemo(() => {
        if (!selectedDoctorId)
            return null;
        return doctors.find((d) => d.id === selectedDoctorId);
    }, [selectedDoctorId, doctors]);
    const handleSubmit = async () => {
        if (!formData.content.trim())
            return;
        if (!selectedDoctorId)
            return;
        setSubmitting(true);
        try {
            await createActivity({
                doctorId: selectedDoctorId,
                type: formData.type,
                content: formData.content,
                result: formData.result || undefined,
                nextFollowUpAt: formData.nextFollowUpAt || undefined,
            });
            setFormData({ type: 'CALL', content: '', result: '', nextFollowUpAt: '' });
        }
        catch (error) {
            console.error('Failed to create activity:', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const doctorOptions = useMemo(() => [
        { value: '', label: 'All Doctors' },
        ...doctors.map((d) => ({ value: d.id, label: d.name }))
    ], [doctors]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Activities" }), selectedDoctor && (_jsxs("p", { className: "text-slate-500 mt-1", children: ["Next follow-up: ", selectedDoctor.nextFollowUpAt
                                        ? new Date(selectedDoctor.nextFollowUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                        : 'Not scheduled'] }))] }), _jsx(Button, { onClick: () => setQuickAddOpen(!quickAddOpen), children: quickAddOpen ? 'Cancel' : '+ Add Activity' })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("label", { className: "text-sm text-gray-500", children: "Doctor:" }), _jsx(Select, { value: selectedDoctorId || '', onChange: (e) => setSelectedDoctor(e.target.value || null), options: doctorOptions, className: "w-64" })] }), quickAddOpen && (_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Doctor" }), _jsx(Select, { value: selectedDoctorId || '', onChange: (e) => setSelectedDoctor(e.target.value || null), options: doctorOptions, className: "w-full" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Type" }), _jsx(Select, { value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), options: [
                                                { value: 'CALL', label: 'Call' },
                                                { value: 'MESSAGE', label: 'Message' },
                                                { value: 'MEETING', label: 'Meeting' },
                                                { value: 'DEMO', label: 'Demo' },
                                                { value: 'SAMPLE_SENT', label: 'Sample Sent' },
                                            ], className: "w-full" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Content *" }), _jsx("textarea", { value: formData.content, onChange: (e) => setFormData({ ...formData, content: e.target.value }), placeholder: "What happened?", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3 })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Result" }), _jsx(Select, { value: formData.result, onChange: (e) => setFormData({ ...formData, result: e.target.value }), options: [
                                                { value: '', label: 'Select result' },
                                                { value: 'interested', label: 'Interested' },
                                                { value: 'not_interested', label: 'Not Interested' },
                                                { value: 'follow_up_needed', label: 'Follow-up Needed' },
                                            ], className: "w-full" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Next Follow-up" }), _jsx("input", { type: "date", value: formData.nextFollowUpAt, onChange: (e) => setFormData({ ...formData, nextFollowUpAt: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { onClick: handleSubmit, disabled: !formData.content.trim() || !selectedDoctorId || submitting, children: submitting ? 'Saving...' : 'Submit' }) })] }) })), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : (_jsxs("div", { className: "space-y-6", children: [groupedActivities.today.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase mb-3", children: "Today" }), _jsx("div", { className: "space-y-3", children: groupedActivities.today.map((activity) => (_jsx(ActivityCard, { activity: activity, expanded: expandedId === activity.id, onToggle: () => setExpandedId(expandedId === activity.id ? null : activity.id) }, activity.id))) })] })), groupedActivities.yesterday.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase mb-3", children: "Yesterday" }), _jsx("div", { className: "space-y-3", children: groupedActivities.yesterday.map((activity) => (_jsx(ActivityCard, { activity: activity, expanded: expandedId === activity.id, onToggle: () => setExpandedId(expandedId === activity.id ? null : activity.id) }, activity.id))) })] })), Object.entries(groupedActivities.dates).map(([dateKey, dateActivities]) => (_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase mb-3", children: formatDateHeader(dateKey) }), _jsx("div", { className: "space-y-3", children: dateActivities.map((activity) => (_jsx(ActivityCard, { activity: activity, expanded: expandedId === activity.id, onToggle: () => setExpandedId(expandedId === activity.id ? null : activity.id) }, activity.id))) })] }, dateKey))), activities.length === 0 && (_jsx("div", { className: "text-center py-12 text-gray-500", children: "No activities yet. Click \"+ Add Activity\" to get started." }))] }))] }));
}
function ActivityCard({ activity, expanded, onToggle }) {
    const typeKey = activity.type;
    const icon = typeIcons[typeKey] || _jsx(ActivityIcon, { className: "w-4 h-4" });
    return (_jsx("div", { className: "cursor-pointer hover:shadow-md transition-shadow", onClick: onToggle, children: _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center", children: icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "font-medium text-slate-800", children: activity.doctorName }), _jsx("span", { className: "text-sm text-gray-400", children: formatTime(activity.createdAt) })] }), _jsx("p", { className: "text-sm text-slate-600 truncate", children: activity.content }), _jsx("div", { className: "flex items-center gap-3 mt-2", children: _jsxs("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${gpsStatusColors[activity.gpsStatus]}`, children: [activity.gpsStatus === 'VALID' && '✅ ', activity.gpsStatus === 'SUSPICIOUS' && '⚠️ ', gpsStatusLabels[activity.gpsStatus], activity.distanceMeters && ` (${activity.distanceMeters}m)`] }) }), expanded && (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-100 space-y-3", children: [activity.result && (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 uppercase", children: "Result" }), _jsx("p", { className: "text-sm font-medium", children: activity.result.replace('_', ' ') })] })), activity.nextFollowUpAt && (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 uppercase", children: "Next Follow-up" }), _jsx("p", { className: "text-sm", children: new Date(activity.nextFollowUpAt).toLocaleDateString() })] })), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 uppercase", children: "Logged by" }), _jsx("p", { className: "text-sm", children: activity.salesName })] })] })), _jsxs("button", { className: "mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1", children: [expanded ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }), expanded ? 'Less' : 'More'] })] })] }) }) }));
}

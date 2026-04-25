import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
export function DoctorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    useEffect(() => {
        if (id)
            loadDoctorData(id);
    }, [id]);
    const loadDoctorData = async (doctorId) => {
        setLoading(true);
        try {
            const data = await doctorService.getDoctor(doctorId);
            setDoctor(data);
        }
        catch (error) {
            console.error('Failed to load doctor:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return _jsx("div", { className: "p-6", children: "Loading..." });
    }
    if (!doctor) {
        return _jsx("div", { className: "p-6", children: "Doctor not found" });
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx(Button, { variant: "ghost", onClick: () => navigate('/doctors'), children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsx("div", { className: "flex-1", children: _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: doctor.name }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs(Card, { children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: doctor.name }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: doctor.specialty || 'No specialty' })] }), _jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Phone" }), _jsx("p", { className: "font-medium", children: doctor.phone })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Hospital" }), _jsx("p", { className: "font-medium", children: doctor.hospitalName || 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Potential Level" }), _jsx("p", { className: "font-medium", children: doctor.potentialLevel })] }), doctor.assignedSalesName && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Assigned Sales" }), _jsx("p", { className: "font-medium", children: doctor.assignedSalesName })] }))] })] }) }), _jsx("div", { className: "lg:col-span-2", children: _jsxs(Card, { children: [_jsx("div", { className: "flex border-b border-gray-200 mb-4", children: ['overview', 'activities', 'deals', 'orders'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: tab.charAt(0).toUpperCase() + tab.slice(1) }, tab))) }), activeTab === 'overview' && (_jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Name" }), _jsx("p", { className: "font-medium", children: doctor.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Specialty" }), _jsx("p", { className: "font-medium", children: doctor.specialty || 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Phone" }), _jsx("p", { className: "font-medium", children: doctor.phone })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Hospital" }), _jsx("p", { className: "font-medium", children: doctor.hospitalName || 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Potential Level" }), _jsx("p", { className: "font-medium", children: doctor.potentialLevel })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Created" }), _jsx("p", { className: "font-medium", children: new Date(doctor.createdAt).toLocaleDateString() })] })] }) })), activeTab === 'activities' && (_jsx("p", { className: "text-gray-500", children: "Activity history will be shown here" })), activeTab === 'deals' && (_jsx("p", { className: "text-gray-500", children: "Associated deals will be shown here" })), activeTab === 'orders' && (_jsx("p", { className: "text-gray-500", children: "Associated orders will be shown here" }))] }) })] })] }));
}

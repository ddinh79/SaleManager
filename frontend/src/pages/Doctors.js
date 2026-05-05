import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { hospitalService } from '../services/hospitalService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
const potentialLevelColors = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-yellow-100 text-yellow-700',
    C: 'bg-slate-100 text-slate-700',
};
export const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [potentialLevel, setPotentialLevel] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        phone: '',
        zalo: '',
        hospitalId: '',
        address: '',
        potentialLevel: 'C',
    });
    useEffect(() => {
        loadData();
    }, [searchTerm, potentialLevel]);
    const loadData = async () => {
        setLoading(true);
        try {
            const [doctorsRes, hospitalsRes] = await Promise.all([
                doctorService.getDoctors({
                    search: searchTerm || undefined,
                    potentialLevel: potentialLevel || undefined,
                }),
                hospitalService.getHospitals(),
            ]);
            setDoctors(doctorsRes.Data);
            setHospitals(hospitalsRes);
        }
        catch (error) {
            console.error('Failed to load data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await doctorService.createDoctor(formData);
            setShowModal(false);
            setFormData({
                name: '',
                specialty: '',
                phone: '',
                zalo: '',
                hospitalId: '',
                address: '',
                potentialLevel: 'C',
            });
            loadData();
        }
        catch (error) {
            console.error('Failed to create doctor:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const columns = [
        { key: 'name', header: 'Name' },
        { key: 'specialty', header: 'Specialty' },
        { key: 'phone', header: 'Phone' },
        { key: 'hospitalName', header: 'Hospital' },
        {
            key: 'potentialLevel',
            header: 'Potential',
            render: (doctor) => (_jsxs("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${potentialLevelColors[doctor.potentialLevel]}`, children: ["Level ", doctor.potentialLevel] })),
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Doctors" }), _jsx("p", { className: "text-slate-500", children: "Manage your doctor relationships" })] }), _jsxs(Button, { onClick: () => setShowModal(true), children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Doctor"] })] }), _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsx("div", { className: "flex-1 min-w-[200px]", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Search doctors...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }) }), _jsx(Select, { options: [
                                { value: '', label: 'All Levels' },
                                { value: 'A', label: 'Level A' },
                                { value: 'B', label: 'Level B' },
                                { value: 'C', label: 'Level C' },
                            ], value: potentialLevel, onChange: (e) => setPotentialLevel(e.target.value), className: "w-[150px]" })] }) }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: doctors, emptyMessage: "No doctors found" }) }), _jsx(Modal, { isOpen: showModal, onClose: () => setShowModal(false), title: "Add New Doctor", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true }), _jsx(Input, { label: "Specialty", value: formData.specialty, onChange: (e) => setFormData({ ...formData, specialty: e.target.value }) }), _jsx(Input, { label: "Phone", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), required: true }), _jsx(Input, { label: "Zalo", value: formData.zalo, onChange: (e) => setFormData({ ...formData, zalo: e.target.value }) }), _jsx(Select, { label: "Hospital", options: [
                                { value: '', label: 'Select Hospital' },
                                ...hospitals.map((h) => ({ value: h.id, label: h.name })),
                            ], value: formData.hospitalId, onChange: (e) => setFormData({ ...formData, hospitalId: e.target.value }), required: true }), _jsx(Input, { label: "Address", value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }) }), _jsx(Select, { label: "Potential Level", options: [
                                { value: 'A', label: 'Level A - High Priority' },
                                { value: 'B', label: 'Level B - Medium Priority' },
                                { value: 'C', label: 'Level C - Low Priority' },
                            ], value: formData.potentialLevel, onChange: (e) => setFormData({ ...formData, potentialLevel: e.target.value }) }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx(Button, { type: "button", variant: "ghost", onClick: () => setShowModal(false), className: "flex-1", children: "Cancel" }), _jsx(Button, { type: "submit", loading: loading, className: "flex-1", children: "Add Doctor" })] })] }) })] }));
};

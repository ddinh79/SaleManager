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
import { Doctor, Hospital, PotentialLevel } from '../types';

const potentialLevelColors: Record<PotentialLevel, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-slate-100 text-slate-700',
};

export const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
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
    potentialLevel: 'C' as PotentialLevel,
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
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error) {
      console.error('Failed to create doctor:', error);
    } finally {
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
      render: (doctor: Doctor) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${potentialLevelColors[doctor.potentialLevel]}`}>
          Level {doctor.potentialLevel}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-slate-500">Manage your doctor relationships</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Add Doctor
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Select
            options={[
              { value: '', label: 'All Levels' },
              { value: 'A', label: 'Level A' },
              { value: 'B', label: 'Level B' },
              { value: 'C', label: 'Level C' },
            ]}
            value={potentialLevel}
            onChange={(e) => setPotentialLevel(e.target.value)}
            className="w-[150px]"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table columns={columns} data={doctors} emptyMessage="No doctors found" />
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Doctor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Specialty"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Zalo"
            value={formData.zalo}
            onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
          />
          <Select
            label="Hospital"
            options={[
              { value: '', label: 'Select Hospital' },
              ...hospitals.map((h) => ({ value: h.id, label: h.name })),
            ]}
            value={formData.hospitalId}
            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Select
            label="Potential Level"
            options={[
              { value: 'A', label: 'Level A - High Priority' },
              { value: 'B', label: 'Level B - Medium Priority' },
              { value: 'C', label: 'Level C - Low Priority' },
            ]}
            value={formData.potentialLevel}
            onChange={(e) => setFormData({ ...formData, potentialLevel: e.target.value as PotentialLevel })}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Add Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { Doctor } from '../types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

type TabType = 'overview' | 'activities' | 'deals' | 'orders';

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (id) loadDoctorData(id);
  }, [id]);

  const loadDoctorData = async (doctorId: string) => {
    setLoading(true);
    try {
      const data = await doctorService.getDoctor(doctorId);
      setDoctor(data);
    } catch (error) {
      console.error('Failed to load doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!doctor) {
    return <div className="p-6">Doctor not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/doctors')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{doctor.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{doctor.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{doctor.specialty || 'No specialty'}</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{doctor.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hospital</p>
                <p className="font-medium">{doctor.hospitalName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Potential Level</p>
                <p className="font-medium">{doctor.potentialLevel}</p>
              </div>
              {doctor.assignedSalesName && (
                <div>
                  <p className="text-sm text-gray-500">Assigned Sales</p>
                  <p className="font-medium">{doctor.assignedSalesName}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex border-b border-gray-200 mb-4">
              {(['overview', 'activities', 'deals', 'orders'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{doctor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Specialty</p>
                    <p className="font-medium">{doctor.specialty || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{doctor.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital</p>
                    <p className="font-medium">{doctor.hospitalName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Potential Level</p>
                    <p className="font-medium">{doctor.potentialLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{new Date(doctor.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <p className="text-gray-500">Activity history will be shown here</p>
            )}

            {activeTab === 'deals' && (
              <p className="text-gray-500">Associated deals will be shown here</p>
            )}

            {activeTab === 'orders' && (
              <p className="text-gray-500">Associated orders will be shown here</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
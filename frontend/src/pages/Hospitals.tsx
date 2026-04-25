import { Link } from 'react-router-dom';
import { Building2, MapPin, Users } from 'lucide-react';
import { Card } from '../components/common/Card';

const hospitals = [
  {
    id: '1',
    name: 'City General Hospital',
    address: '123 Nguyen Trai Street, District 1, HCMC',
    doctorCount: 45,
  },
  {
    id: '2',
    name: 'Heart Center',
    address: '456 Le Duan Street, District 3, HCMC',
    doctorCount: 28,
  },
  {
    id: '3',
    name: 'Bone & Joint Institute',
    address: '789 Tran Hung Dao Street, District 5, HCMC',
    doctorCount: 32,
  },
  {
    id: '4',
    name: 'Brain Neurology Hospital',
    address: '321 Vo Thi Sau Street, District 3, HCMC',
    doctorCount: 19,
  },
  {
    id: '5',
    name: 'Vietnam National Hospital',
    address: '567 Cach Mang Thang 8 Street, District 10, HCMC',
    doctorCount: 67,
  },
  {
    id: '6',
    name: 'International Medical Center',
    address: '890 Pham Ngoc Thach Street, District 3, HCMC',
    doctorCount: 24,
  },
];

export const Hospitals: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hospitals</h1>
        <p className="text-slate-500">Browse and manage hospital partners</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((hospital) => (
          <Card key={hospital.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{hospital.name}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{hospital.address}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                  <Users className="w-4 h-4" />
                  <span>{hospital.doctorCount} doctors</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                to={`/doctors?hospital=${hospital.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Doctors →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
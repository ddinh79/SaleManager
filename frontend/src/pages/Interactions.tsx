import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '../components/common/Card';

interface Interaction {
  id: number;
  title: string;
  doctor: string;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in_progress' | 'pending';
}

const mockInteractions: Interaction[] = [
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

export const Interactions: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-slate-600" />
        <h1 className="text-2xl font-semibold text-slate-800">Interactions</h1>
      </div>

      <div className="grid gap-4">
        {mockInteractions.map((interaction) => (
          <Card key={interaction.id}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-slate-500">#{interaction.id}</span>
                    <span className={`text-sm font-medium ${priorityColors[interaction.priority]}`}>
                      {interaction.priority.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-1">{interaction.title}</h3>
                  <p className="text-sm text-slate-500">Doctor: {interaction.doctor}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[interaction.status]}`}>
                  {interaction.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
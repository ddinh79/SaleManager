import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { userService, UserFilters } from '../services/userService';
import { User, UserRole } from '../types';
import { RoleBadge } from '../components/common/RoleBadge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { useNavigate } from 'react-router-dom';

export function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const filters: UserFilters = {};
      if (roleFilter) filters.role = roleFilter as UserRole;
      if (statusFilter) filters.status = statusFilter as 'active' | 'inactive';
      const data = await userService.getAll(filters);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-500">{user.fullName[0]}</span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{user.fullName}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (user: User) => <RoleBadge role={user.role} size="sm" /> },
    { key: 'manager', header: 'Manager', render: (user: User) => user.managerName || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500">Manage your team members</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            options={[
              { value: '', label: 'All Roles' },
              { value: 'Admin', label: 'Admin' },
              { value: 'SalesManager', label: 'Manager' },
              { value: 'SalesMember', label: 'Sales' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32"
          />
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={filteredUsers} emptyMessage="No users found" />
      </Card>
    </div>
  );
}
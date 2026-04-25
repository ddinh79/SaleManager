import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { TopBar } from '../components/common/TopBar';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar className="w-60 flex-shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
import { Outlet } from 'react-router-dom';
import { SidebarNew } from '../components/SidebarNew';
import { TopBarNew } from '../components/TopBarNew';
import { CommandPalette } from '../components/CommandPalette';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      <SidebarNew className="flex-shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBarNew />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

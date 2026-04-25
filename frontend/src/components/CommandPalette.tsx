import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Activity, MessageSquare, Search } from 'lucide-react';
import { useUiStore } from '../store/uiStore';

interface SearchItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const searchItems: SearchItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Doctors', path: '/doctors', icon: <Stethoscope className="w-5 h-5" /> },
  { label: 'Activities', path: '/activities', icon: <Activity className="w-5 h-5" /> },
  { label: 'Interactions', path: '/interactions', icon: <MessageSquare className="w-5 h-5" /> },
];

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { searchModalOpen, closeSearchModal } = useUiStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (searchModalOpen) {
          closeSearchModal();
        } else {
          useUiStore.getState().openSearchModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, closeSearchModal]);

  useEffect(() => {
    if (searchModalOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [searchModalOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        closeSearchModal();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          closeSearchModal();
        }
        break;
    }
  };

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSearchModal}
      />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-14 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
          />
          <kbd className="px-2 py-1 text-xs text-slate-400 bg-slate-100 rounded">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">No results found</div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  closeSearchModal();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Enter</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Ctrl+K</kbd> Toggle
          </span>
        </div>
      </div>
    </div>
  );
};
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Radar, MessageSquare, Megaphone, Settings, Search } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contatos', icon: Users },
  { to: '/radar', label: 'Radar', icon: Radar, badge: 2 },
  { to: '/conversas', label: 'Conversas', icon: MessageSquare },
  { to: '/campanhas', label: 'Campanhas', icon: Megaphone, badge: 3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const [search, setSearch] = useState('');

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-zellu-800 text-white">
      <div className="border-b border-zellu-700 p-4">
        <h1 className="text-xl font-bold tracking-tight">Zellu</h1>
        <p className="mt-0.5 text-xs text-zellu-400">Farmácia Saúde & Vida</p>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zellu-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-zellu-700/50 py-2 pl-9 pr-3 text-xs text-zellu-200 placeholder-zellu-500 outline-none focus:bg-zellu-700 focus:ring-1 focus:ring-zellu-500"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-3">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? 'bg-zellu-600/30 font-medium text-white'
                  : 'text-zellu-300 hover:bg-zellu-700/50 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-zellu-400" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zellu-700 p-4">
        <p className="text-sm font-medium text-zellu-200">Dra. Ana Paula</p>
        <p className="text-xs text-zellu-500">Farmacêutica Responsável</p>
      </div>
    </aside>
  );
}

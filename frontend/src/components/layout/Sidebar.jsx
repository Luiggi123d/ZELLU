import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Radar, Activity, Megaphone, Settings, Search, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { classifyForRadar } from '../../lib/dataHelpers';

const navItemsBase = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contatos', icon: Users },
  { to: '/radar', label: 'Radar', icon: Radar, badgeKey: 'radar' },
  { to: '/pulse', label: 'Pulse', icon: Activity, badgeKey: 'complaints' },
  { to: '/campanhas', label: 'Campanhas', icon: Megaphone, badgeKey: 'campaigns' },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const [search, setSearch] = useState('');
  const [badges, setBadges] = useState({ radar: 0, campaigns: 0, complaints: 0 });

  const pharmacyName = profile?.pharmacies?.name || 'Sua farmácia';
  const userName = profile?.full_name || 'Usuário';
  const userRole = profile?.role === 'owner' ? 'Proprietário' : profile?.role === 'admin' ? 'Admin' : 'Equipe';

  useEffect(() => {
    let cancelled = false;
    async function loadBadges() {
      if (!profile?.pharmacy_id) return;
      const [contactsRes, campaignsRes, complaintsRes] = await Promise.all([
        supabase.from('contacts').select('last_purchase_at').eq('pharmacy_id', profile.pharmacy_id),
        supabase.from('campaigns').select('status').eq('pharmacy_id', profile.pharmacy_id).eq('status', 'draft'),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
          .eq('pharmacy_id', profile.pharmacy_id)
          .eq('has_complaint', true)
          .gte('last_message_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      if (cancelled) return;
      const classified = classifyForRadar(contactsRes.data || []);
      setBadges({
        radar: classified.lost.length + classified.cooling.length,
        campaigns: (campaignsRes.data || []).length,
        complaints: complaintsRes.count || 0,
      });
    }
    loadBadges();
    return () => { cancelled = true; };
  }, [profile?.pharmacy_id]);

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-zellu-800 text-white">
      <div className="border-b border-zellu-700 p-4">
        <h1 className="text-xl font-bold tracking-tight">Zellu</h1>
        <p className="mt-0.5 truncate text-xs text-zellu-400">{pharmacyName}</p>
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
        {navItemsBase.map(({ to, label, icon: Icon, badgeKey }) => {
          const badge = badgeKey ? badges[badgeKey] : 0;
          return (
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
                  {badge > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-zellu-700 p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-zellu-200">{userName}</p>
          <p className="truncate text-xs text-zellu-500">{userRole}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zellu-300 transition-colors hover:bg-zellu-700/50 hover:text-white"
        >
          <LogOut size={14} />Sair
        </button>
      </div>
    </aside>
  );
}

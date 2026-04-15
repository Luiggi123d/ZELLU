import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, Megaphone, DollarSign, Target, Wifi, TrendingUp, Zap, Clock } from 'lucide-react';
import { formatCurrency } from '../../lib/mockData';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { computeDashboardMetrics } from '../../lib/dataHelpers';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;
  const firstName = (profile?.full_name || '').split(' ')[0];

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pid = profile?.pharmacy_id;
      if (!pid) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const [contactsRes, campaignsRes] = await Promise.all([
          supabase.from('contacts').select('*').eq('pharmacy_id', pid),
          supabase.from('campaigns').select('*').eq('pharmacy_id', pid),
        ]);
        if (contactsRes.error) throw contactsRes.error;
        if (campaignsRes.error) throw campaignsRes.error;
        if (cancelled) return;
        setContacts(contactsRes.data || []);
        setCampaigns(campaignsRes.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  const hasData = contacts.length > 0 || campaigns.length > 0;

  // Empty state — user just signed up, no WhatsApp connected yet
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-[#16a34a] p-6 text-white">
          <h1 className="text-2xl font-bold">Bem-vindo{firstName ? `, ${firstName}` : ''}!</h1>
          <p className="mt-1 text-white/80">Conecte seu WhatsApp para começar a receber contatos e mensagens automaticamente.</p>
        </div>
        <div className="card p-6">
          <EmptyState
            icon={Wifi}
            title="Sua farmácia ainda não tem dados"
            description="Conecte seu WhatsApp nas configurações para importar contatos automaticamente. Assim que começarem as conversas, você verá métricas, alertas e campanhas sugeridas aqui."
            ctaLabel="Conectar WhatsApp"
            ctaTo="/configuracoes"
          />
        </div>
      </div>
    );
  }

  const metrics = computeDashboardMetrics({ contacts, campaigns });
  const pendingCampaigns = campaigns.filter((c) => c.status === 'draft' || c.status === 'scheduled').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-[#16a34a] p-6 text-white">
        <h1 className="text-2xl font-bold">Bom dia{firstName ? `, ${firstName}` : ''}!</h1>
        <p className="mt-1 text-white/80">
          {metrics.atRisk > 0 ? (
            <>Sua farmácia tem <span className="font-semibold text-amber-200">{metrics.atRisk} clientes em risco</span> hoje. Vamos agir para mantê-los?</>
          ) : (
            <>Tudo tranquilo por aqui. Continue acompanhando seus clientes.</>
          )}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total de clientes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zellu-50"><Users size={16} className="text-zellu-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.total}</p>
          <p className="mt-1 text-xs text-gray-400">cadastrados</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Clientes em risco</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50"><AlertTriangle size={16} className="text-red-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">{metrics.atRisk}</p>
          <p className="mt-1 text-xs text-gray-400">perdidos + esfriando</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Campanhas pendentes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50"><Megaphone size={16} className="text-amber-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{metrics.pendingCampaigns}</p>
          <p className="mt-1 text-xs text-gray-400">aguardando aprovação</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Receita em risco</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><DollarSign size={16} className="text-gray-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(metrics.revenueAtRisk)}</p>
          <p className="mt-1 text-xs text-gray-400">estimativa dos clientes em risco</p>
        </div>
      </div>

      {/* Two action cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><Target size={18} className="text-zellu-600" />Clientes para agir hoje</h2>
            <Link to="/radar" className="text-sm text-zellu-600 hover:underline">Ver todos</Link>
          </div>
          {metrics.urgentClients.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhum cliente em risco no momento</p>
          ) : (
            <div className="space-y-3">
              {metrics.urgentClients.map((c) => (
                <div key={c.id} className={`flex items-center justify-between rounded-lg p-3 ${c.status === 'lost' ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <div>
                    <p className="font-medium text-gray-900">{c.name || c.phone}</p>
                    <p className="text-xs text-gray-500">{c.tags?.join(', ') || 'Sem tags'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.days ?? '—'}d
                    </span>
                    <Link to="/radar" className="rounded-lg bg-zellu-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-zellu-700">Agir</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><Megaphone size={18} className="text-amber-600" />Campanhas aguardando</h2>
            <Link to="/campanhas" className="text-sm text-zellu-600 hover:underline">Ver todas</Link>
          </div>
          {pendingCampaigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhuma campanha aguardando aprovação</p>
          ) : (
            <div className="space-y-3">
              {pendingCampaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.total_recipients || 0} destinatários</p>
                  </div>
                  <Link to="/campanhas" className="rounded-lg bg-zellu-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-zellu-700">Revisar</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row — Health of base */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900"><Target size={18} className="text-zellu-600" />Saúde da base</h2>
          {metrics.total === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Sem contatos ainda</p>
          ) : (
            <>
              <div className="flex h-6 overflow-hidden rounded-full">
                {metrics.active > 0 && (
                  <div className="flex items-center justify-center bg-emerald-500 text-[10px] font-bold text-white" style={{ width: `${(metrics.active / metrics.total) * 100}%` }}>
                    {metrics.active}
                  </div>
                )}
                {metrics.cooling > 0 && (
                  <div className="flex items-center justify-center bg-amber-400 text-[10px] font-bold text-white" style={{ width: `${(metrics.cooling / metrics.total) * 100}%` }}>
                    {metrics.cooling}
                  </div>
                )}
                {metrics.lost > 0 && (
                  <div className="flex items-center justify-center bg-red-500 text-[10px] font-bold text-white" style={{ width: `${(metrics.lost / metrics.total) * 100}%` }}>
                    {metrics.lost}
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-emerald-600">{metrics.active} ativos</span>
                <span className="text-amber-600">{metrics.cooling} esfriando</span>
                <span className="text-red-600">{metrics.lost} perdidos</span>
              </div>
            </>
          )}
        </div>
        <div className="card bg-zellu-50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zellu-800"><Zap size={16} className="text-zellu-600" />Impacto do Zellu</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-gray-600"><Users size={12} />Contatos</span>
              <span className="text-sm font-bold text-zellu-700">{metrics.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-gray-600"><TrendingUp size={12} />Ativos</span>
              <span className="text-sm font-bold text-zellu-700">{metrics.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-gray-600"><Clock size={12} />Em risco</span>
              <span className="text-sm font-bold text-zellu-700">{metrics.atRisk}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

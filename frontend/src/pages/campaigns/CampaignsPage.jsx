import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Clock, CheckCircle, Send, X, Calendar, ArrowLeft, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';
import EmptyState from '../../components/ui/EmptyState';

const tabs = [
  { key: 'pending', label: 'Aguardando aprovação', dbStatuses: ['draft'] },
  { key: 'approved', label: 'Aprovadas', dbStatuses: ['scheduled', 'running'] },
  { key: 'sent', label: 'Enviadas', dbStatuses: ['completed'] },
  { key: 'all', label: 'Todas', dbStatuses: null },
];

const statusBadge = {
  draft: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-blue-100 text-blue-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  canceled: 'bg-gray-100 text-gray-500',
};
const statusLabel = {
  draft: 'Aguardando',
  scheduled: 'Agendada',
  running: 'Em andamento',
  completed: 'Enviada',
  canceled: 'Cancelada',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function ApprovalModal({ campaign, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Confirmar aprovação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="mb-4 text-sm text-gray-500">{campaign.name}</p>
        <div className="mb-4 rounded-lg bg-emerald-50 p-4">
          <p className="mb-1 text-xs font-semibold text-emerald-700">Mensagem que será enviada:</p>
          <p className="text-sm leading-relaxed text-gray-700">{campaign.message_template}</p>
        </div>
        <p className="mb-4 text-xs text-gray-500">Destinatários previstos: {campaign.total_recipients || 0}</p>
        {campaign.scheduled_at && (
          <p className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar size={14} />Envio sugerido: {formatDate(campaign.scheduled_at)}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700">
            <CheckCircle size={16} />Confirmar aprovação
          </button>
          <button onClick={onClose} className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [approvalTarget, setApprovalTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!pharmacyId) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (err) setError(err.message);
      else setCampaigns(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [pharmacyId]);

  const counts = useMemo(() => ({
    pending: campaigns.filter((c) => c.status === 'draft').length,
    approved: campaigns.filter((c) => c.status === 'scheduled' || c.status === 'running').length,
    sent: campaigns.filter((c) => c.status === 'completed').length,
  }), [campaigns]);

  const filtered = useMemo(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    if (!tab?.dbStatuses) return campaigns;
    return campaigns.filter((c) => tab.dbStatuses.includes(c.status));
  }, [campaigns, activeTab]);

  async function approve(campaign) {
    const prevStatus = campaign.status;
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, status: 'scheduled' } : c)));
    setApprovalTarget(null);

    const { error: err } = await supabase
      .from('campaigns')
      .update({ status: 'scheduled', scheduled_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
      .eq('id', campaign.id);

    if (err) {
      // rollback
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, status: prevStatus } : c)));
      showToast(`Erro ao aprovar: ${err.message}`);
      return;
    }

    showToast(`Campanha "${campaign.name}" aprovada! Será enviada em 15 minutos.`, {
      onUndo: async () => {
        setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, status: prevStatus } : c)));
        await supabase.from('campaigns').update({ status: prevStatus, scheduled_at: null }).eq('id', campaign.id);
      },
    });
  }

  async function reject(campaign) {
    const snapshot = campaigns;
    setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    const { error: err } = await supabase.from('campaigns').delete().eq('id', campaign.id);
    if (err) {
      setCampaigns(snapshot);
      showToast(`Erro ao rejeitar: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">Erro ao carregar campanhas: {error}</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-sm text-gray-500">Campanhas sugeridas pela IA e campanhas manuais</p>
        </div>
        <div className="card p-6">
          <EmptyState
            icon={Megaphone}
            title="Nenhuma campanha ainda"
            description="Assim que houver contatos suficientes, a IA do Zellu vai sugerir campanhas automaticamente. Conecte seu WhatsApp para começar."
            ctaLabel="Conectar WhatsApp"
            ctaTo="/configuracoes"
            ctaIcon={Wifi}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
        <p className="text-sm text-gray-500">Campanhas sugeridas pela IA e campanhas manuais</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Aguardando</p><Clock size={18} className="text-amber-500" /></div>
          <p className="mt-1 text-3xl font-bold text-amber-600">{counts.pending}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Aprovadas</p><CheckCircle size={18} className="text-blue-500" /></div>
          <p className="mt-1 text-3xl font-bold text-blue-600">{counts.approved}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Enviadas</p><Send size={18} className="text-emerald-500" /></div>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{counts.sent}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === key ? 'border-zellu-600 text-zellu-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
            {key === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Megaphone size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">Nenhuma campanha nesta categoria</p>
          </div>
        ) : (
          filtered.map((campaign) => (
            <div key={campaign.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[campaign.status] || campaign.status}
                    </span>
                  </div>
                  {(campaign.target_tags || []).length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">Tags: {(campaign.target_tags || []).join(', ')}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{campaign.total_recipients || 0}</p>
                  <p className="text-xs text-gray-400">destinatários</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium text-gray-400">Preview</p>
                <p className="text-sm text-gray-700">{campaign.message_template}</p>
              </div>
              {campaign.status === 'completed' && (
                <div className="mt-4 flex gap-6">
                  <div className="text-sm"><span className="font-semibold text-gray-900">{campaign.sent_count || 0}</span> <span className="text-gray-400">enviadas</span></div>
                  <div className="text-sm"><span className="font-semibold text-emerald-600">{campaign.delivered_count || 0}</span> <span className="text-gray-400">entregues</span></div>
                  <div className="text-sm"><span className="font-semibold text-blue-600">{campaign.read_count || 0}</span> <span className="text-gray-400">lidas</span></div>
                  {campaign.completed_at && (
                    <div className="flex items-center gap-1 text-sm text-gray-400"><Calendar size={12} />Enviada em {formatDate(campaign.completed_at)}</div>
                  )}
                </div>
              )}
              {(campaign.status === 'scheduled' || campaign.status === 'running') && campaign.scheduled_at && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar size={14} />Envio programado: {formatDate(campaign.scheduled_at)}
                </p>
              )}
              {campaign.status === 'draft' && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm text-gray-500"><Calendar size={14} />Criada em {formatDate(campaign.created_at)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setApprovalTarget(campaign)} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700">
                      <CheckCircle size={14} />Aprovar
                    </button>
                    <button onClick={() => reject(campaign)} className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">
                      <X size={14} />Rejeitar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {approvalTarget && (
        <ApprovalModal
          campaign={approvalTarget}
          onConfirm={() => approve(approvalTarget)}
          onClose={() => setApprovalTarget(null)}
        />
      )}
    </div>
  );
}

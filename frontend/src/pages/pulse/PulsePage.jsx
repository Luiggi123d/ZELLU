import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { timeAgo, formatCurrency } from '../../lib/mockData';
import { usePageData } from '../../hooks/usePageData';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  Heart, MessageCircle, BarChart2, Activity, TrendingUp, TrendingDown,
  AlertCircle, MessageSquare, Megaphone, UserCheck, Loader2,
  ThumbsDown, ChevronDown, ChevronUp, Zap, CheckCircle, Clock,
} from 'lucide-react';

// -- Helpers -------------------------------------------------
function SentimentBar({ positive, neutral, negative, total }) {
  if (total === 0) return <p className="text-sm text-gray-400">Sem dados ainda</p>;
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        {positive > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(positive / total) * 100}%` }} />}
        {neutral > 0 && <div className="bg-gray-300 transition-all" style={{ width: `${(neutral / total) * 100}%` }} />}
        {negative > 0 && <div className="bg-red-400 transition-all" style={{ width: `${(negative / total) * 100}%` }} />}
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={11} /> {positive} satisfeitos</span>
        <span className="flex items-center gap-1 text-gray-400"><Activity size={11} /> {neutral} neutros</span>
        <span className="flex items-center gap-1 text-red-500"><AlertCircle size={11} /> {negative} insatisfeitos</span>
      </div>
    </div>
  );
}

function EventIcon({ type }) {
  const map = {
    client_recovered: <UserCheck size={14} className="text-emerald-600" />,
    campaign_sent: <Megaphone size={14} className="text-blue-600" />,
    new_contact: <TrendingUp size={14} className="text-zellu-600" />,
    client_lost_risk: <TrendingDown size={14} className="text-red-500" />,
    complaint_detected: <AlertCircle size={14} className="text-amber-600" />,
    onboarding_complete: <Zap size={14} className="text-zellu-600" />,
  };
  return map[type] || <Activity size={14} className="text-gray-400" />;
}

function ComplaintCard({ conv, expanded, onToggle }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Reclamacao
            </span>
            {(conv.complaint_topics || []).map((t) => (
              <span key={t} className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 border border-gray-200">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-700">{conv.complaint_summary}</p>
          <p className="mt-1 text-xs text-gray-400">
            {conv.contacts?.name || conv.contacts?.phone} · {timeAgo(conv.last_message_at)}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 rounded-lg bg-white p-3 border border-red-100">
          <p className="mb-2 text-xs font-semibold text-gray-500">Conversa:</p>
          <p className="text-xs text-gray-500 italic">
            Abra a conversa completa no historico do cliente para ver os detalhes.
          </p>
        </div>
      )}
    </div>
  );
}

// -- Pagina principal ----------------------------------------
export default function PulsePage() {
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [activeTab, setActiveTab] = useState('pulse');

  // Usa usePageData — ganha stale-while-revalidate, visibility, focus, refetch
  const { data, loading, error, refetch } = usePageData(async (pid) => {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      pharmacyRes,
      conversationsRes,
      complaintsRes,
      eventsRes,
      contactsRes,
      todayMsgRes,
    ] = await Promise.all([
      supabase.from('pharmacies').select('onboarding_status, onboarding_completed_at').eq('id', pid).single(),
      supabase.from('conversations').select('sentiment').eq('pharmacy_id', pid).gte('last_message_at', since30),
      supabase.from('conversations')
        .select('id, complaint_summary, complaint_topics, last_message_at, contacts(name, phone)')
        .eq('pharmacy_id', pid)
        .eq('has_complaint', true)
        .gte('last_message_at', since30)
        .order('last_message_at', { ascending: false })
        .limit(10),
      supabase.from('pharmacy_events')
        .select('*')
        .eq('pharmacy_id', pid)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('contacts').select('id, last_purchase_at, ai_behavior').eq('pharmacy_id', pid),
      supabase.from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('pharmacy_id', pid)
        .gte('created_at', today.toISOString()),
    ]);

    // Sentimentos
    const convs = conversationsRes.data || [];
    const sentiment = {
      positive: convs.filter((c) => c.sentiment === 'positive').length,
      neutral: convs.filter((c) => c.sentiment === 'neutral').length,
      negative: convs.filter((c) => c.sentiment === 'negative').length,
      total: convs.length,
    };

    // Clientes recuperados (voltaram nos ultimos 7 dias)
    const contacts = contactsRes.data || [];
    const recovered = contacts.filter((c) => {
      if (!c.last_purchase_at) return false;
      return new Date(c.last_purchase_at) >= new Date(since7);
    }).length;

    const buyers = contacts.filter((c) => c.ai_behavior === 'buyer').length;

    return {
      onboardingStatus: pharmacyRes.data?.onboarding_status || 'pending',
      pulseData: {
        todayMessages: todayMsgRes.count || 0,
        recovered,
        buyers,
        sentiment,
        totalConversations: convs.length,
      },
      complaints: complaintsRes.data || [],
      events: eventsRes.data || [],
    };
  });

  const onboardingStatus = data?.onboardingStatus || 'pending';
  const pulseData = data?.pulseData || null;
  const complaints = data?.complaints || [];
  const events = data?.events || [];

  // Polling enquanto onboarding esta processando
  useEffect(() => {
    if (onboardingStatus !== 'processing') return;
    const interval = setInterval(refetch, 8000);
    return () => clearInterval(interval);
  }, [onboardingStatus, refetch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">Erro ao carregar Pulse: {error}</p>
      </div>
    );
  }

  // Onboarding em andamento
  if (onboardingStatus === 'processing') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zellu-100">
          <Loader2 size={28} className="animate-spin text-zellu-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analisando sua farmacia...</h2>
          <p className="mt-1 text-sm text-gray-500">
            A IA esta lendo os ultimos 30 dias de conversas.<br />
            Isso leva alguns minutos. Voce recebera um aviso quando estiver pronto.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-zellu-50 px-4 py-2 text-sm text-zellu-700">
          <Activity size={14} className="animate-pulse" />
          Processando historico de conversas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pulse</h1>
        <p className="text-sm text-gray-500">Saude da sua farmacia em tempo real</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'pulse', label: 'Pulso da Farmacia', icon: Heart },
          { key: 'voice', label: 'Voz do Cliente', icon: MessageCircle },
        ].map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-zellu-600 text-zellu-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5"><TabIcon size={14} /> {label}</span>
            {key === 'voice' && complaints.length > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {complaints.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'pulse' && (
        <>
          {/* Metricas do dia */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Mensagens hoje</p>
                <MessageSquare size={16} className="text-zellu-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{pulseData?.todayMessages || 0}</p>
              <p className="mt-1 text-xs text-gray-400">conversas ativas</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Clientes voltaram</p>
                <UserCheck size={16} className="text-emerald-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{pulseData?.recovered || 0}</p>
              <p className="mt-1 text-xs text-gray-400">nos ultimos 7 dias</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Compradores ativos</p>
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-blue-600">{pulseData?.buyers || 0}</p>
              <p className="mt-1 text-xs text-gray-400">identificados pela IA</p>
            </div>
          </div>

          {/* Sentimento geral */}
          <div className="card p-6">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900"><BarChart2 size={16} className="text-zellu-600" /> Humor da base</h2>
            <p className="mb-4 text-xs text-gray-400">Baseado nas conversas dos ultimos 30 dias</p>
            <SentimentBar {...(pulseData?.sentiment || { positive: 0, neutral: 0, negative: 0, total: 0 })} />
          </div>

          {/* Linha do tempo */}
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900"><Clock size={16} className="text-gray-500" /> Linha do tempo</h2>
            {events.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                Os eventos da sua farmacia aparecerao aqui conforme o Zellu trabalha.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <EventIcon type={event.type} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-gray-500">{event.description}</p>
                      )}
                      {event.value_brl > 0 && (
                        <p className="text-xs font-semibold text-emerald-600">
                          + {formatCurrency(event.value_brl)}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(event.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'voice' && (
        <>
          {/* Resumo de reclamacoes */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><MessageCircle size={16} className="text-zellu-600" /> O que seus clientes estao dizendo</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ultimos 30 dias · analise automatica por IA</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                complaints.length === 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : complaints.length < 5
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {complaints.length === 0 ? (<span className="flex items-center gap-1"><CheckCircle size={12} /> Sem reclamacoes</span>) : `${complaints.length} reclamacoes`}
              </div>
            </div>

            {/* Topicos mais frequentes */}
            {complaints.length > 0 && (() => {
              const topicCount = {};
              complaints.forEach((c) => {
                (c.complaint_topics || []).forEach((t) => {
                  topicCount[t] = (topicCount[t] || 0) + 1;
                });
              });
              const sorted = Object.entries(topicCount).sort((a, b) => b[1] - a[1]);
              return sorted.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">Principais topicos:</p>
                  <div className="flex flex-wrap gap-2">
                    {sorted.map(([topic, count]) => (
                      <span key={topic} className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
                        <ThumbsDown size={10} />
                        {topic} ({count}x)
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Sentimento negativo */}
            {pulseData?.sentiment && pulseData.sentiment.negative > 0 && (
              <div className="mb-4 rounded-lg bg-red-50 p-3">
                <p className="text-xs text-red-700">
                  <strong>{pulseData.sentiment.negative}</strong> conversas com sentimento negativo nos ultimos 30 dias
                  {pulseData.sentiment.total > 0 && (
                    <> ({Math.round((pulseData.sentiment.negative / pulseData.sentiment.total) * 100)}% do total)</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Lista de reclamacoes */}
          {complaints.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <UserCheck size={20} className="text-emerald-600" />
              </div>
              <p className="font-medium text-gray-900">Nenhuma reclamacao detectada</p>
              <p className="mt-1 text-sm text-gray-400">
                A IA monitorou as conversas dos ultimos 30 dias e nao encontrou reclamacoes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Conversas com reclamacao
              </p>
              {complaints.map((conv) => (
                <ComplaintCard
                  key={conv.id}
                  conv={conv}
                  expanded={expandedComplaint === conv.id}
                  onToggle={() => setExpandedComplaint(
                    expandedComplaint === conv.id ? null : conv.id
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { AlertTriangle, DollarSign, Pill, Send, Pencil, Eye, X, CheckCircle, Inbox, Radar, Wifi } from 'lucide-react';
import { formatCurrency } from '../../lib/mockData';
import { supabase } from '../../lib/supabase';
import { classifyForRadar, formatPhoneFromDigits } from '../../lib/dataHelpers';
import { usePageData } from '../../hooks/usePageData';
import { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

function initialsOf(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function buildSuggestion(client) {
  const days = client.days ?? 0;
  const tags = (client.tags || []).join(', ');
  return `Olá ${client.name || ''}! Notamos que faz ${days} dias desde seu último contato com a farmácia. Gostaríamos de saber se está tudo bem e se podemos ajudar em algo. Estamos à disposição!`
    + (tags ? `\n\n(Tags registradas: ${tags})` : '');
}

function SuggestionModal({ client, onClose }) {
  const [message, setMessage] = useState(buildSuggestion(client));
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="w-full max-w-md card p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"><CheckCircle size={28} className="text-emerald-600" /></div>
          <h3 className="text-lg font-bold text-gray-900">Mensagem enviada!</h3>
          <p className="mt-2 text-sm text-gray-500">A mensagem para {client.name} foi enviada via WhatsApp.</p>
          <button onClick={onClose} className="mt-6 h-10 rounded-lg bg-zellu-600 px-6 text-sm font-medium text-white hover:bg-zellu-700">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zellu-100 text-sm font-bold text-zellu-700">{initialsOf(client.name)}</div>
            <div>
              <h3 className="font-bold text-gray-900">Mensagem sugerida pela IA</h3>
              <p className="text-xs text-gray-500">{client.name} — {formatPhoneFromDigits(client.phone)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-400">{client.days ?? '—'} dias sem compra · {client.total_purchases || 0} compras no total</p>
        </div>
        {editing ? (
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500" />
        ) : (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{message}</p></div>
        )}
        <div className="flex gap-2">
          <button onClick={() => setSent(true)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"><Send size={14} />Aprovar e enviar</button>
          <button onClick={() => setEditing(!editing)} className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50">{editing ? <><Eye size={14} />Visualizar</> : <><Pencil size={14} />Editar</>}</button>
          <button onClick={onClose} className="flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50">Voltar</button>
        </div>
      </div>
    </div>
  );
}

function ClientCard({ client, color }) {
  const [showModal, setShowModal] = useState(false);
  const borderColors = { red: 'border-l-red-500', amber: 'border-l-amber-500', orange: 'border-l-orange-400' };
  const dayColors = { red: 'text-red-600 bg-red-50', amber: 'text-amber-600 bg-amber-50', orange: 'text-orange-600 bg-orange-50' };
  const tagsStr = (client.tags || []).join(', ') || 'Sem tags';

  return (
    <>
      <div className={`card border-l-4 p-4 ${borderColors[color]}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{initialsOf(client.name)}</div>
            <div>
              <p className="font-semibold text-gray-900">{client.name || '(sem nome)'}</p>
              <p className="text-xs text-gray-500">{formatPhoneFromDigits(client.phone)}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${dayColors[color]}`}>{client.days ?? '—'}d</span>
        </div>
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-sm text-gray-600"><Pill size={14} className="text-gray-400" />{tagsStr}</p>
          <p className="text-xs text-gray-500">{client.total_purchases || 0} compras no total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"><Send size={14} />Sugerir mensagem</button>
      </div>
      {showModal && <SuggestionModal client={client} onClose={() => setShowModal(false)} />}
    </>
  );
}

function EmptyColumn({ label }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
      <Inbox size={32} className="mb-2 text-gray-300" />
      <p className="text-sm font-medium text-gray-400">Nenhum cliente aqui</p>
      <p className="text-xs text-gray-300">Nenhum cliente {label}</p>
    </div>
  );
}

export default function RadarPage() {
  const { data: contacts = [], loading, error } = usePageData(async (pid) => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('pharmacy_id', pid);
    if (error) throw error;
    return data || [];
  });

  const classified = useMemo(() => classifyForRadar(contacts), [contacts]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <SkeletonList key={i} items={2} />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">Erro ao carregar radar: {error}</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Radar de Clientes</h1>
          <p className="text-sm text-gray-500">Monitore clientes em risco e aja antes de perdê-los</p>
        </div>
        <div className="card p-6">
          <EmptyState
            icon={Radar}
            title="Nenhum cliente para monitorar ainda"
            description="O Radar analisa seus contatos automaticamente e aponta quem está em risco. Conecte seu WhatsApp para começar."
            ctaLabel="Conectar WhatsApp"
            ctaTo="/configuracoes"
            ctaIcon={Wifi}
          />
        </div>
      </div>
    );
  }

  const atRisk = classified.lost.length + classified.cooling.length + classified.observation.length;
  const revenueAtRisk = [...classified.lost, ...classified.cooling].reduce(
    (s, c) => s + (Number(c.total_spent) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Radar de Clientes</h1>
        <p className="text-sm text-gray-500">Monitore clientes em risco e aja antes de perdê-los</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Clientes em risco</p><AlertTriangle size={18} className="text-red-500" /></div>
          <p className="mt-1 text-3xl font-bold text-red-600">{atRisk}</p>
          <p className="mt-1 text-xs text-gray-400">precisam de atenção</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Receita em risco</p><DollarSign size={18} className="text-amber-500" /></div>
          <p className="mt-1 text-3xl font-bold text-amber-600">{formatCurrency(revenueAtRisk)}</p>
          <p className="mt-1 text-xs text-gray-400">em clientes inativos</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Perdidos</p><Pill size={18} className="text-red-500" /></div>
          <p className="mt-1 text-3xl font-bold text-red-600">{classified.lost.length}</p>
          <p className="mt-1 text-xs text-gray-400">sem comprar há mais de 60 dias</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <h2 className="font-semibold text-red-700">Perdidos</h2>
            <span className="text-xs text-gray-400">&gt;60 dias</span>
          </div>
          {classified.lost.length > 0
            ? <div className="space-y-3">{classified.lost.map((c) => <ClientCard key={c.id} client={c} color="red" />)}</div>
            : <EmptyColumn label="perdido" />}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <h2 className="font-semibold text-amber-700">Esfriando</h2>
            <span className="text-xs text-gray-400">30-60 dias</span>
          </div>
          {classified.cooling.length > 0
            ? <div className="space-y-3">{classified.cooling.map((c) => <ClientCard key={c.id} client={c} color="amber" />)}</div>
            : <EmptyColumn label="esfriando" />}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-400" />
            <h2 className="font-semibold text-orange-600">Em observação</h2>
            <span className="text-xs text-gray-400">15-30 dias</span>
          </div>
          {classified.observation.length > 0
            ? <div className="space-y-3">{classified.observation.map((c) => <ClientCard key={c.id} client={c} color="orange" />)}</div>
            : <EmptyColumn label="em observação" />}
        </div>
      </div>
    </div>
  );
}

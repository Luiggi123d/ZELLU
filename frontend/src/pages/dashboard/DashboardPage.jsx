import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, Megaphone, DollarSign, Target, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { formatCurrency } from '../../lib/mockData';
import { SkeletonCard, useSkeletonLoading } from '../../components/ui/Skeleton';

const urgentClients = [
  { name: 'Carlos Eduardo Mendes', days: 92, medication: 'Metformina + Insulina', type: 'lost' },
  { name: 'Roberto Nascimento', days: 147, medication: 'Losartana + Glibenclamida', type: 'lost' },
  { name: 'Antônio José Barbosa', days: 34, medication: 'Anlodipino + Rosuvastatina', type: 'cooling' },
];

const pendingCampaigns = [
  { id: 1, name: 'Reativação uso contínuo', recipients: 5, source: 'IA' },
  { id: 2, name: 'Aniversariantes do mês', recipients: 3, source: 'IA' },
  { id: 3, name: 'Orçamento não fechado', recipients: 4, source: 'IA' },
];

const weekActivity = [
  { day: 'Seg', received: 12, sent: 8 },
  { day: 'Ter', received: 18, sent: 14 },
  { day: 'Qua', received: 9, sent: 11 },
  { day: 'Qui', received: 15, sent: 10 },
  { day: 'Sex', received: 22, sent: 16 },
  { day: 'Sáb', received: 6, sent: 4 },
  { day: 'Dom', received: 3, sent: 2 },
];

const maxMsg = Math.max(...weekActivity.map((d) => Math.max(d.received, d.sent)));

export default function DashboardPage() {
  const loading = useSkeletonLoading();
  const [approvedCampaigns, setApprovedCampaigns] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('week');

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-[#16a34a] p-6 text-white">
        <h1 className="text-2xl font-bold">Bom dia, Dra. Ana Paula!</h1>
        <p className="mt-1 text-white/80">
          Sua farmácia tem <span className="font-semibold text-amber-200">8 clientes em risco</span> hoje.
          Vamos agir para mantê-los?
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total de clientes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zellu-50"><Users size={16} className="text-zellu-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">12</p>
          <p className="mt-1 text-xs text-emerald-600"><TrendingUp size={12} className="mr-1 inline" />2 novos esta semana</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Clientes em risco</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50"><AlertTriangle size={16} className="text-red-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">8</p>
          <p className="mt-1 text-xs text-red-500"><TrendingUp size={12} className="mr-1 inline" />3 a mais que semana passada</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Campanhas pendentes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50"><Megaphone size={16} className="text-amber-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">3</p>
          <p className="mt-1 text-xs text-gray-400">aguardando sua aprovação</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Receita em risco</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><DollarSign size={16} className="text-gray-600" /></div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(12450)}</p>
          <p className="mt-1 text-xs text-gray-400">vs {formatCurrency(9200)} semana passada</p>
        </div>
      </div>

      {/* Two action cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><Target size={18} className="text-zellu-600" />Clientes para agir hoje</h2>
            <Link to="/radar" className="text-sm text-zellu-600 hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {urgentClients.map((client) => (
              <div key={client.name} className={`flex items-center justify-between rounded-lg p-3 ${client.type === 'lost' ? 'bg-red-50' : 'bg-amber-50'}`}>
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.medication}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${client.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {client.days}d
                  </span>
                  <Link to="/radar" className="rounded-lg bg-zellu-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-zellu-700">Agir</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><Megaphone size={18} className="text-amber-600" />Campanhas aguardando</h2>
            <Link to="/campanhas" className="text-sm text-zellu-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {pendingCampaigns.map((c) => {
              const done = approvedCampaigns.includes(c.id);
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">IA</span>
                    </div>
                    <p className="text-xs text-gray-500">{c.recipients} destinatários</p>
                  </div>
                  {done ? (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"><CheckCircle size={12} />Aprovada</span>
                  ) : (
                    <button onClick={() => setApprovedCampaigns((p) => [...p, c.id])} className="rounded-lg bg-zellu-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-zellu-700">Aprovar</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="card col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><TrendingUp size={18} className="text-zellu-600" />Atividade</h2>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
              {[{ k: 'week', l: 'Esta semana' }, { k: 'month', l: 'Este mês' }, { k: '30d', l: '30 dias' }].map(({ k, l }) => (
                <button key={k} onClick={() => setChartPeriod(k)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${chartPeriod === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-3">
            {weekActivity.map(({ day, received, sent }) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full gap-1" style={{ height: '120px', alignItems: 'flex-end' }}>
                  <div className="relative flex-1">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-zellu-600">{received}</span>
                    <div className="w-full rounded-t bg-zellu-300" style={{ height: `${(received / maxMsg) * 100}%` }} />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-zellu-700">{sent}</span>
                    <div className="w-full rounded-t bg-zellu-600" style={{ height: `${(sent / maxMsg) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-zellu-300" /><span className="text-xs text-gray-500">Recebidas</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-zellu-600" /><span className="text-xs text-gray-500">Enviadas</span></div>
          </div>
        </div>

        {/* Health + Impact */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><Target size={16} className="text-zellu-600" />Saúde da base</h2>
            <div className="flex h-6 overflow-hidden rounded-full">
              <div className="flex items-center justify-center bg-emerald-500 text-[10px] font-bold text-white" style={{ width: '58.3%' }}>7</div>
              <div className="flex items-center justify-center bg-amber-400 text-[10px] font-bold text-white" style={{ width: '25%' }}>3</div>
              <div className="flex items-center justify-center bg-red-500 text-[10px] font-bold text-white" style={{ width: '16.7%' }}>2</div>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-emerald-600">7 ativos</span>
              <span className="text-amber-600">3 esfriando</span>
              <span className="text-red-600">2 perdidos</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-500">Score geral</span>
              <span className="text-sm font-bold text-zellu-700">72/100</span>
            </div>
          </div>

          <div className="card bg-zellu-50 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zellu-800"><Zap size={16} className="text-zellu-600" />Impacto do Zellu</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><Clock size={12} />Tempo economizado</span>
                <span className="text-sm font-bold text-zellu-700">4h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><Users size={12} />Clientes recuperados</span>
                <span className="text-sm font-bold text-zellu-700">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><DollarSign size={12} />Receita recuperada</span>
                <span className="text-sm font-bold text-zellu-700">{formatCurrency(680)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

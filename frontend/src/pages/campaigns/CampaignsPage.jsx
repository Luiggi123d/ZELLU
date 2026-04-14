import { useState } from 'react';
import { Megaphone, Clock, CheckCircle, Send, X, Bot, Calendar, Users, ArrowLeft } from 'lucide-react';
import { SkeletonCard, useSkeletonLoading } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';

const initialCampaigns = [
  { id: 1, name: 'Reativação uso contínuo', description: 'IA detectou 5 clientes com medicamentos de uso contínuo sumidos há mais de 30 dias.', message: 'Olá {nome}! Notamos que seu {medicamento} deve estar acabando. Sabemos como é importante não interromper o tratamento. Podemos preparar seu pedido para retirada? Estamos aqui para ajudar!', recipients: [{ name: 'Carlos Eduardo Mendes', medication: 'Metformina + Insulina', days: 92 }, { name: 'Roberto Nascimento', medication: 'Losartana + Glibenclamida', days: 147 }, { name: 'Antônio José Barbosa', medication: 'Anlodipino + Rosuvastatina', days: 34 }, { name: 'João Carlos Oliveira', medication: 'Atenolol + Sinvastatina', days: 28 }, { name: 'Fernanda Alves', medication: 'Fluoxetina 20mg', days: 18 }], total: 5, status: 'pending', suggestedDate: '15/04/2026', source: 'IA' },
  { id: 2, name: 'Aniversariantes do mês — Abril', description: 'IA identificou 3 clientes que fazem aniversário em abril. Oportunidade de fidelização.', message: 'Parabéns, {nome}! A Farmácia Saúde & Vida preparou um presente especial: 10% de desconto em qualquer compra durante o mês do seu aniversário. Passe aqui e comemore com a gente!', recipients: [{ name: 'Lucia Fernanda Almeida', medication: 'Passiflora + Melatonina', days: 4 }, { name: 'Antônio José Barbosa', medication: 'Anlodipino + Rosuvastatina', days: 34 }, { name: 'Juliana Santos', medication: 'Levotiroxina 75mcg', days: 12 }], total: 3, status: 'pending', suggestedDate: '16/04/2026', source: 'IA' },
  { id: 3, name: 'Orçamento não fechado — Manipulados', description: 'IA detectou 4 clientes que pediram orçamento de manipulados e não retornaram.', message: 'Oi {nome}! Você pediu um orçamento de manipulado recentemente e queremos saber: ainda tem interesse? Mantivemos as condições especiais por mais 3 dias. Qualquer dúvida, estamos aqui!', recipients: [{ name: 'Ana Beatriz Ferreira', medication: 'Ácido Hialurônico Creme', days: 3 }, { name: 'Renata Campos', medication: 'Retinol Sérum 0.5%', days: 1 }, { name: 'Marcos Pereira', medication: 'Fórmula anti-refluxo', days: 7 }, { name: 'Patrícia Rocha', medication: 'Vitamina C manipulada', days: 5 }], total: 4, status: 'pending', suggestedDate: '14/04/2026', source: 'IA' },
  { id: 4, name: 'Dica de Saúde — Outono e Imunidade', description: 'Campanha educativa sobre reforço da imunidade no outono.', message: 'Oi {nome}! Com a chegada do outono, é hora de reforçar a imunidade. Vitamina C, D e Zinco são grandes aliados. Passe na farmácia para orientação gratuita!', recipients: [], total: 12, status: 'approved', suggestedDate: '17/04/2026', source: 'Manual' },
  { id: 5, name: 'Gestante — Importância do DHA', description: 'Campanha para gestantes sobre suplementação com DHA.', message: 'Oi {nome}! Sabia que o DHA é essencial para o desenvolvimento do bebê? Converse com nossa farmacêutica sobre a suplementação ideal.', recipients: [{ name: 'Mariana Rodrigues', medication: 'DHA Gestante', days: 0 }], total: 1, status: 'approved', suggestedDate: '14/04/2026', source: 'IA' },
  { id: 6, name: 'Semana do Coração — Hipertensão', description: 'Campanha sobre a importância do controle da pressão.', message: 'Oi {nome}! Esta semana é dedicada à saúde do coração. Agende sua aferição de pressão gratuita aqui na farmácia!', recipients: [], total: 8, status: 'sent', sentDate: '07/04/2026', delivered: 7, read: 5, source: 'Manual' },
  { id: 7, name: 'Promoção Genéricos — Março', description: 'Promoção mensal de genéricos para clientes frequentes.', message: 'Oi {nome}! Neste mês temos condições especiais em genéricos. Confira as ofertas!', recipients: [], total: 12, status: 'sent', sentDate: '01/04/2026', delivered: 11, read: 8, source: 'IA' },
];

const tabs = [
  { key: 'pending', label: 'Aguardando aprovação' },
  { key: 'approved', label: 'Aprovadas' },
  { key: 'sent', label: 'Enviadas' },
  { key: 'all', label: 'Todas' },
];

const statusBadge = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', sent: 'bg-emerald-100 text-emerald-700' };
const statusLabel = { pending: 'Aguardando', approved: 'Aprovada', sent: 'Enviada' };

function ApprovalModal({ campaign, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Confirmar aprovação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{campaign.name}</p>
        <div className="rounded-lg bg-emerald-50 p-4 mb-4">
          <p className="mb-1 text-xs font-semibold text-emerald-700">Mensagem que será enviada:</p>
          <p className="text-sm leading-relaxed text-gray-700">{campaign.message}</p>
        </div>
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Users size={12} />Destinatários ({campaign.total})</p>
          <div className="space-y-2">
            {campaign.recipients.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div><p className="text-sm font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-500">{r.medication}</p></div>
                {r.days > 0 && <span className="text-xs text-gray-400">{r.days}d</span>}
              </div>
            ))}
          </div>
        </div>
        <p className="mb-6 flex items-center gap-1.5 text-sm text-gray-500"><Calendar size={14} />Envio sugerido: {campaign.suggestedDate}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"><CheckCircle size={16} />Confirmar aprovação</button>
          <button onClick={onClose} className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50"><ArrowLeft size={14} />Voltar</button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const loading = useSkeletonLoading();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [activeTab, setActiveTab] = useState('pending');
  const [approvalTarget, setApprovalTarget] = useState(null);

  const counts = { pending: campaigns.filter((c) => c.status === 'pending').length, approved: campaigns.filter((c) => c.status === 'approved').length, sent: campaigns.filter((c) => c.status === 'sent').length };
  const filtered = activeTab === 'all' ? campaigns : campaigns.filter((c) => c.status === activeTab);

  function approve(id) {
    const campaign = campaigns.find((c) => c.id === id);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c)));
    setApprovalTarget(null);
    showToast(`Campanha "${campaign?.name}" aprovada! Será enviada em 15 minutos.`, {
      onUndo: () => setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'pending' } : c))),
    });
  }

  function reject(id) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return <div className="space-y-6"><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Campanhas</h1><p className="text-sm text-gray-500">Campanhas sugeridas pela IA e campanhas manuais</p></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Aguardando</p><Clock size={18} className="text-amber-500" /></div><p className="mt-1 text-3xl font-bold text-amber-600">{counts.pending}</p></div>
        <div className="card p-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Aprovadas</p><CheckCircle size={18} className="text-blue-500" /></div><p className="mt-1 text-3xl font-bold text-blue-600">{counts.approved}</p></div>
        <div className="card p-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Enviadas este mês</p><Send size={18} className="text-emerald-500" /></div><p className="mt-1 text-3xl font-bold text-emerald-600">{counts.sent}</p></div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`relative border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === key ? 'border-zellu-600 text-zellu-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
            {key === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{counts.pending}</span>
            )}
            {key !== 'all' && key !== 'pending' && counts[key] !== undefined && <span className="ml-1 text-gray-400">({counts[key]})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((campaign) => (
          <div key={campaign.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[campaign.status]}`}>{statusLabel[campaign.status]}</span>
                  {campaign.source === 'IA' && <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><Bot size={10} />IA</span>}
                </div>
                <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
              </div>
              <div className="text-right"><p className="text-2xl font-bold text-gray-900">{campaign.total}</p><p className="text-xs text-gray-400">destinatários</p></div>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-4"><p className="mb-1 text-xs font-medium text-gray-400">Preview</p><p className="text-sm text-gray-700">{campaign.message}</p></div>
            {campaign.status === 'sent' && (
              <div className="mt-4 flex gap-6">
                <div className="text-sm"><span className="font-semibold text-gray-900">{campaign.total}</span> <span className="text-gray-400">enviadas</span></div>
                <div className="text-sm"><span className="font-semibold text-emerald-600">{campaign.delivered}</span> <span className="text-gray-400">entregues</span></div>
                <div className="text-sm"><span className="font-semibold text-blue-600">{campaign.read}</span> <span className="text-gray-400">lidas</span></div>
                <div className="flex items-center gap-1 text-sm text-gray-400"><Calendar size={12} />Enviada em {campaign.sentDate}</div>
              </div>
            )}
            {campaign.status === 'approved' && <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-500"><Calendar size={14} />Envio programado: {campaign.suggestedDate}</p>}
            {campaign.status === 'pending' && (
              <div className="mt-4 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm text-gray-500"><Calendar size={14} />Envio sugerido: {campaign.suggestedDate}</p>
                <div className="flex gap-2">
                  <button onClick={() => setApprovalTarget(campaign)} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"><CheckCircle size={14} />Aprovar</button>
                  <button onClick={() => reject(campaign.id)} className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"><X size={14} />Rejeitar</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="py-12 text-center"><Megaphone size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-400">Nenhuma campanha nesta categoria</p></div>}
      </div>
      {approvalTarget && <ApprovalModal campaign={approvalTarget} onConfirm={() => approve(approvalTarget.id)} onClose={() => setApprovalTarget(null)} />}
    </div>
  );
}

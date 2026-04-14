import { useState } from 'react';
import { AlertTriangle, DollarSign, Pill, Send, Pencil, Eye, X, CheckCircle, Inbox } from 'lucide-react';
import { formatCurrency } from '../../lib/mockData';
import { SkeletonCard, SkeletonList, useSkeletonLoading } from '../../components/ui/Skeleton';

const radarData = {
  lost: [
    { id: '4', name: 'Carlos Eduardo Mendes', initials: 'CE', days: 92, medications: 'Metformina 850mg + Insulina NPH', totalSpent: 1560.30, continuous: true, phone: '(11) 95432-1098', suggestion: 'Olá Carlos, tudo bem? Notamos que faz 92 dias desde sua última visita. Seus medicamentos Metformina e Insulina devem estar acabando. Sabemos como é importante não interromper o tratamento de diabetes. Podemos preparar seu pedido para retirada ainda hoje? Estamos aqui para ajudar!' },
    { id: '8', name: 'Roberto Nascimento', initials: 'RN', days: 147, medications: 'Losartana 50mg + Glibenclamida 5mg', totalSpent: 890.40, continuous: true, phone: '(11) 91098-7654', suggestion: 'Olá Roberto! Faz um tempinho que não nos vemos. Seus medicamentos Losartana e Glibenclamida são essenciais para seu tratamento. Que tal passar na farmácia essa semana? Preparamos tudo com carinho para você.' },
  ],
  cooling: [
    { id: '10', name: 'Antônio José Barbosa', initials: 'AJ', days: 34, medications: 'Anlodipino 5mg + Rosuvastatina 10mg', totalSpent: 3150.60, continuous: true, phone: '(11) 99876-5432', suggestion: 'Oi Antônio! Tudo bem com o senhor? Notamos que faz 34 dias desde a última compra do Anlodipino e Rosuvastatina. Manter o tratamento em dia é fundamental para sua saúde cardiovascular. Já separamos seus medicamentos!' },
    { id: '2', name: 'João Carlos Oliveira', initials: 'JC', days: 28, medications: 'Atenolol 25mg + Sinvastatina 20mg', totalSpent: 2180.40, continuous: true, phone: '(11) 97654-3210', suggestion: 'Olá João! Como vai? Seu Atenolol e Sinvastatina devem estar acabando. Sabemos que a correria do dia a dia às vezes faz a gente esquecer, mas seu coração agradece a regularidade. Quer que separemos para você?' },
    { id: '6', name: 'Pedro Henrique Costa', initials: 'PH', days: 22, medications: 'Whey Protein + Creatina', totalSpent: 960.00, continuous: false, phone: '(11) 93210-9876', suggestion: 'E aí Pedro! Chegou uma nova remessa de Creatina com ótimo preço. Já que você costuma levar junto com o Whey, preparei uma condição especial. Passa aqui quando puder!' },
  ],
  watching: [
    { id: 'w1', name: 'Fernanda Alves', initials: 'FA', days: 18, medications: 'Fluoxetina 20mg', totalSpent: 680.00, continuous: true, phone: '(11) 98234-5678', suggestion: 'Oi Fernanda! Tudo bem? Sua Fluoxetina deve estar acabando em breve. Quer que a gente separe para retirada? Estamos sempre à disposição!' },
    { id: 'w2', name: 'Marcos Pereira', initials: 'MP', days: 15, medications: 'Omeprazol 20mg + Domperidona', totalSpent: 520.00, continuous: true, phone: '(11) 97345-6789', suggestion: 'Olá Marcos! Passando para lembrar que o Omeprazol e a Domperidona devem estar na reta final. Manter o tratamento gástrico em dia faz toda diferença. Posso separar para você?' },
    { id: 'w3', name: 'Juliana Santos', initials: 'JS', days: 12, medications: 'Levotiroxina 75mcg', totalSpent: 1240.00, continuous: true, phone: '(11) 96456-7890', suggestion: 'Oi Juliana! Sua Levotiroxina deve estar acabando nos próximos dias. Como é um medicamento de uso contínuo para tireoide, é importante não ficar sem. Quer que prepare seu pedido?' },
  ],
};

const allClients = [...radarData.lost, ...radarData.cooling, ...radarData.watching];
const totalAtRisk = allClients.length;
const revenueAtRisk = allClients.reduce((s, c) => s + c.totalSpent, 0);
const continuousLost = allClients.filter((c) => c.continuous).length;

function SuggestionModal({ client, onClose }) {
  const [message, setMessage] = useState(client.suggestion);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zellu-100 text-sm font-bold text-zellu-700">{client.initials}</div>
            <div>
              <h3 className="font-bold text-gray-900">Mensagem sugerida pela IA</h3>
              <p className="text-xs text-gray-500">{client.name} — {client.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-400">{client.days} dias sem compra · {client.medications} · {formatCurrency(client.totalSpent)} total</p>
        </div>
        {editing ? (
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500" />
        ) : (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm leading-relaxed text-gray-700">{message}</p></div>
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

  return (
    <>
      <div className={`card border-l-4 p-4 ${borderColors[color]}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{client.initials}</div>
            <div><p className="font-semibold text-gray-900">{client.name}</p><p className="text-xs text-gray-500">{client.phone}</p></div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${dayColors[color]}`}>{client.days}d</span>
        </div>
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-sm text-gray-600"><Pill size={14} className="text-gray-400" />{client.medications}</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{formatCurrency(client.totalSpent)}</p>
            {client.continuous && <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">Uso contínuo</span>}
          </div>
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
      <p className="text-xs text-gray-300">Ótima notícia! Nenhum cliente {label}</p>
    </div>
  );
}

export default function RadarPage() {
  const loading = useSkeletonLoading();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonList key={i} items={2} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Radar de Clientes</h1><p className="text-sm text-gray-500">Monitore clientes em risco e aja antes de perdê-los</p></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Clientes em risco</p><AlertTriangle size={18} className="text-red-500" /></div><p className="mt-1 text-3xl font-bold text-red-600">{totalAtRisk}</p><p className="mt-1 text-xs text-gray-400">precisam de atenção</p></div>
        <div className="card p-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Receita em risco</p><DollarSign size={18} className="text-amber-500" /></div><p className="mt-1 text-3xl font-bold text-amber-600">{formatCurrency(revenueAtRisk)}</p><p className="mt-1 text-xs text-gray-400">em clientes inativos</p></div>
        <div className="card p-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Uso contínuo sumidos</p><Pill size={18} className="text-red-500" /></div><p className="mt-1 text-3xl font-bold text-red-600">{continuousLost}</p><p className="mt-1 text-xs text-gray-400">sem comprar medicamento essencial</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" /><h2 className="font-semibold text-red-700">Perdidos</h2><span className="text-xs text-gray-400">&gt;60 dias</span></div>
          {radarData.lost.length > 0 ? <div className="space-y-3">{radarData.lost.map((c) => <ClientCard key={c.id} client={c} color="red" />)}</div> : <EmptyColumn label="perdido" />}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-500" /><h2 className="font-semibold text-amber-700">Esfriando</h2><span className="text-xs text-gray-400">20-60 dias</span></div>
          {radarData.cooling.length > 0 ? <div className="space-y-3">{radarData.cooling.map((c) => <ClientCard key={c.id} client={c} color="amber" />)}</div> : <EmptyColumn label="esfriando" />}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-orange-400" /><h2 className="font-semibold text-orange-600">Em observação</h2><span className="text-xs text-gray-400">10-20 dias</span></div>
          {radarData.watching.length > 0 ? <div className="space-y-3">{radarData.watching.map((c) => <ClientCard key={c.id} client={c} color="orange" />)}</div> : <EmptyColumn label="em observação" />}
        </div>
      </div>
    </div>
  );
}

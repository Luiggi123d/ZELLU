import { useState } from 'react';
import { Search, Send, Lightbulb } from 'lucide-react';
import { SkeletonList, useSkeletonLoading } from '../../components/ui/Skeleton';

const conversations = [
  { id: 1, name: 'Maria Silva Santos', initials: 'MS', phone: '(11) 98765-4321', status: 'urgent', statusLabel: 'Urgente', lastTime: '10:30', preview: 'Bom dia! Meu remédio da pressão acabou, posso pegar hoje?', clientStatus: 'Ativo · Score 92',
    messages: [{ id: 1, dir: 'in', text: 'Bom dia! Meu remédio da pressão acabou, posso pegar hoje?', time: '10:30' }, { id: 2, dir: 'in', text: 'É a Losartana 50mg e a Metformina 850mg', time: '10:31' }],
    aiSuggestion: 'Bom dia, Maria! Claro, já estou separando sua Losartana 50mg e Metformina 850mg. Pode retirar a partir das 11h. Precisa de mais alguma coisa?' },
  { id: 2, name: 'Ana Beatriz Ferreira', initials: 'AB', phone: '(11) 96543-2109', status: 'waiting', statusLabel: 'Aguardando', lastTime: '09:45', preview: 'O sérum de vitamina C ficou pronto? Posso buscar depois das 15h?', clientStatus: 'Ativo · Score 88',
    messages: [{ id: 1, dir: 'out', text: 'Oi Ana! Seu manipulado ficou pronto. Pode retirar a partir de amanhã.', time: 'Ontem 16:00' }, { id: 2, dir: 'in', text: 'O sérum de vitamina C ficou pronto? Posso buscar depois das 15h?', time: '09:45' }],
    aiSuggestion: 'Oi Ana! Sim, seu Sérum de Vitamina C está pronto! Pode buscar a partir das 15h. Vou deixar separado no balcão com seu nome.' },
  { id: 3, name: 'Francisca Lima Souza', initials: 'FL', phone: '(11) 94321-0987', status: 'urgent', statusLabel: 'Urgente', lastTime: '08:00', preview: 'Bom dia, é o filho da Dona Francisca. Pode separar os remédios dela?', clientStatus: 'Ativo · Score 95',
    messages: [{ id: 1, dir: 'in', text: 'Bom dia, é o filho da Dona Francisca. Pode separar os remédios dela? Passo aí depois do almoço.', time: '08:00' }],
    aiSuggestion: 'Bom dia! Claro, vou separar todos os 5 medicamentos da Dona Francisca: Omeprazol, Losartana, Metformina, Levotiroxina e Cálcio + Vit D. Total: R$ 198,70. Pode passar quando quiser!' },
  { id: 4, name: 'Mariana Rodrigues', initials: 'MR', phone: '(11) 90987-6543', status: 'answered', statusLabel: 'Respondido', lastTime: '09:30', preview: 'Ótimo!! Passo aí às 16h. Obrigada!', clientStatus: 'Ativo · Score 85 · Gestante',
    messages: [{ id: 1, dir: 'in', text: 'Oi! Preciso do DHA gestante e ácido fólico, tem aí?', time: '09:15' }, { id: 2, dir: 'out', text: 'Oi Mariana! Temos sim, tudo pronto pra você!', time: '09:20' }, { id: 3, dir: 'out', text: 'Separei tudo pra você! Pode vir buscar até as 18h. DHA + Ácido Fólico = R$ 135,00', time: '09:30' }, { id: 4, dir: 'in', text: 'Ótimo!! Passo aí às 16h. Obrigada!', time: '09:32' }],
    aiSuggestion: null },
  { id: 5, name: 'Lucia Fernanda Almeida', initials: 'LF', phone: '(11) 92109-8765', status: 'answered', statusLabel: 'Respondido', lastTime: 'Ontem', preview: 'Obrigada pela indicação! Vou experimentar o magnésio quelado.', clientStatus: 'Ativo · Score 78',
    messages: [{ id: 1, dir: 'in', text: 'Oi, estou com muita ansiedade ultimamente. Tem algo natural que ajude?', time: 'Ontem 17:30' }, { id: 2, dir: 'out', text: 'Oi Lucia! O magnésio quelado tem ajudado muito. Associado com passiflora, o efeito é ainda melhor.', time: 'Ontem 17:45' }, { id: 3, dir: 'in', text: 'Obrigada pela indicação! Vou experimentar o magnésio quelado.', time: 'Ontem 18:00' }],
    aiSuggestion: null },
  { id: 6, name: 'João Carlos Oliveira', initials: 'JC', phone: '(11) 97654-3210', status: 'waiting', statusLabel: 'Aguardando', lastTime: '10/04', preview: 'Oi João! Faz tempo que não te vemos. Seus medicamentos estão aqui.', clientStatus: 'Esfriando · Score 54',
    messages: [{ id: 1, dir: 'out', text: 'Oi João! Faz tempo que não te vemos. Tá tudo bem? Seus medicamentos estão separados aqui.', time: '10/04 14:00' }],
    aiSuggestion: null },
  { id: 7, name: 'Renata Campos', initials: 'RC', phone: '(11) 98888-1234', status: 'waiting', statusLabel: 'Aguardando', lastTime: '09:00', preview: 'Oi! O retinol que encomendei chegou?', clientStatus: 'Ativo · Score 81',
    messages: [{ id: 1, dir: 'in', text: 'Oi! O retinol que encomendei chegou? O sérum 0.5%', time: '09:00' }],
    aiSuggestion: 'Oi Renata! Sim, seu Retinol Sérum 0.5% chegou! Pode retirar hoje a partir das 14h. Lembre-se de usar só à noite e sempre com protetor solar pela manhã.' },
  { id: 8, name: 'José Aparecido da Silva', initials: 'JA', phone: '(11) 97777-5678', status: 'answered', statusLabel: 'Respondido', lastTime: '11/04', preview: 'Pronto seu José! Entrega confirmada para amanhã de manhã.', clientStatus: 'Ativo · Score 90 · Entrega',
    messages: [{ id: 1, dir: 'in', text: 'Bom dia, pode entregar meus remédios do mês? Tô com dificuldade de sair.', time: '11/04 10:00' }, { id: 2, dir: 'out', text: 'Claro seu José! Já separei os 5 medicamentos. Entrega amanhã no endereço de sempre?', time: '11/04 10:15' }, { id: 3, dir: 'in', text: 'Isso mesmo, obrigado!', time: '11/04 10:20' }, { id: 4, dir: 'out', text: 'Pronto seu José! Entrega confirmada para amanhã de manhã. Total: R$ 165,00', time: '11/04 10:30' }],
    aiSuggestion: null },
];

const statusStyles = { urgent: 'bg-red-100 text-red-700', waiting: 'bg-amber-100 text-amber-700', answered: 'bg-emerald-100 text-emerald-700' };

export default function ConversationsPage() {
  const loading = useSkeletonLoading();
  const [selected, setSelected] = useState(conversations[0]);
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  const filtered = search.trim() ? conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : conversations;

  if (loading) {
    return <div className="flex h-[calc(100vh-3rem)] gap-0 card overflow-hidden"><div className="w-[40%] p-4"><SkeletonList items={6} /></div><div className="w-[60%] bg-gray-50" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-0 overflow-hidden card">
      <div className="flex w-[40%] flex-col border-r border-gray-200">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar conversa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-zellu-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <div key={conv.id} onClick={() => setSelected(conv)} className={`flex cursor-pointer gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${selected.id === conv.id ? 'bg-zellu-50' : ''}`}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zellu-100 text-sm font-bold text-zellu-700">{conv.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><p className="truncate font-medium text-gray-900">{conv.name}</p><span className="flex-shrink-0 text-xs text-gray-400">{conv.lastTime}</span></div>
                <p className="truncate text-sm text-gray-500">{conv.preview}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[conv.status]}`}>{conv.statusLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-[60%] flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zellu-100 text-sm font-bold text-zellu-700">{selected.initials}</div>
            <div><p className="font-semibold text-gray-900">{selected.name}</p><p className="text-xs text-gray-500">{selected.clientStatus}</p></div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selected.status]}`}>{selected.statusLabel}</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-6" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e5e7eb\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
          {selected.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.dir === 'out' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.dir === 'out' ? 'rounded-br-md bg-emerald-100 text-gray-800' : 'rounded-bl-md bg-white text-gray-800'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`mt-1 text-right text-[10px] ${msg.dir === 'out' ? 'text-emerald-600' : 'text-gray-400'}`}>{msg.time}{msg.dir === 'out' && ' ✓✓'}</p>
              </div>
            </div>
          ))}
        </div>
        {selected.aiSuggestion && (
          <div className="border-t border-amber-200 bg-amber-50 px-6 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-xs font-semibold text-amber-700"><Lightbulb size={12} />Sugestão da IA</p><p className="mt-1 truncate text-sm text-amber-800">{selected.aiSuggestion}</p></div>
              <button onClick={() => setInputText(selected.aiSuggestion)} className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">Usar sugestão</button>
            </div>
          </div>
        )}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input type="text" placeholder="Digite sua mensagem..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-zellu-500 focus:outline-none" />
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zellu-600 text-white hover:bg-zellu-700"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

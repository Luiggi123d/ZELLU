import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Megaphone, Tag, StickyNote, ShoppingCart, Send, Lightbulb } from 'lucide-react';
import { mockContacts, getStatusLabel, getStatusColor, getScoreColor, getScoreBarColor, formatCurrency, formatDate, timeAgo } from '../../lib/mockData';
import { SkeletonCard, useSkeletonLoading } from '../../components/ui/Skeleton';

export default function ContactDetailPage() {
  const { id } = useParams();
  const contact = mockContacts.find((c) => c.id === id);
  const loading = useSkeletonLoading();

  if (loading) {
    return <div className="space-y-6"><SkeletonCard lines={3} /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div><SkeletonCard lines={6} /></div>;
  }

  if (!contact) {
    return <div className="py-20 text-center"><p className="text-gray-400">Contato não encontrado</p><Link to="/contacts" className="mt-4 inline-block text-zellu-600 hover:underline">Voltar para contatos</Link></div>;
  }

  const historyIcons = { purchase: ShoppingCart, message: MessageSquare, campaign: Megaphone };
  const historyColors = { purchase: 'bg-emerald-100 text-emerald-600', message: 'bg-blue-100 text-blue-600', campaign: 'bg-purple-100 text-purple-600' };

  return (
    <div className="space-y-6">
      <Link to="/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-zellu-600"><ArrowLeft size={16} />Voltar para contatos</Link>
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zellu-100 text-xl font-bold text-zellu-700">{contact.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
            <div>
              <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contact.status)}`}>{getStatusLabel(contact.status)}</span></div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500"><span>{contact.phone}</span>{contact.email && <span>{contact.email}</span>}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 hover:bg-gray-50"><Send size={14} />Enviar mensagem</button>
            <button className="flex h-10 items-center rounded-lg bg-zellu-600 px-4 text-sm font-medium text-white hover:bg-zellu-700">Editar</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{contact.tags.map((tag) => <span key={tag} className="rounded-full bg-zellu-50 px-3 py-1 text-xs font-medium text-zellu-700">{tag}</span>)}</div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-xs text-gray-500">Score</p><div className="mt-2 flex items-center gap-2"><span className={`text-2xl font-bold ${getScoreColor(contact.relationship_score)}`}>{contact.relationship_score}</span><span className="text-sm text-gray-400">/100</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${getScoreBarColor(contact.relationship_score)}`} style={{ width: `${contact.relationship_score}%` }} /></div></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Total Gasto</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(contact.total_spent)}</p><p className="mt-1 text-xs text-gray-400">{contact.total_purchases} compras</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Ticket Médio</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(contact.avg_ticket)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Última Compra</p><p className="mt-2 text-lg font-bold text-gray-900">{timeAgo(contact.last_purchase_at)}</p><p className="mt-1 text-xs text-gray-400">{formatDate(contact.last_purchase_at)}</p></div>
          </div>
          <div className="card p-6"><h2 className="font-semibold text-gray-900">Medicamentos / Produtos</h2><div className="mt-3 flex flex-wrap gap-2">{contact.medications.map((med) => <span key={med} className="flex items-center gap-1.5 rounded-lg border border-zellu-200 bg-zellu-50 px-3 py-1.5 text-sm text-zellu-800">{med}</span>)}</div></div>
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Histórico</h2>
            <div className="mt-4 space-y-4">
              {contact.history.map((event, i) => {
                const Icon = historyIcons[event.type] || ShoppingCart;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${historyColors[event.type]}`}><Icon size={14} /></div>
                      {i < contact.history.length - 1 && <div className="mt-1 h-full w-px bg-gray-200" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-900">{event.description}</p>{event.value && <span className="text-sm font-semibold text-emerald-600">{formatCurrency(event.value)}</span>}</div>
                      <p className="mt-0.5 text-xs text-gray-400">{formatDate(event.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-6"><h2 className="font-semibold text-gray-900">Notas</h2><p className="mt-3 text-sm leading-relaxed text-gray-600">{contact.notes}</p></div>
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Ações Rápidas</h2>
            <div className="mt-3 space-y-2">
              {[
                { icon: MessageSquare, label: 'Iniciar conversa no WhatsApp' },
                { icon: Megaphone, label: 'Incluir em campanha' },
                { icon: Tag, label: 'Editar tags' },
                { icon: StickyNote, label: 'Adicionar nota' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-4 text-left text-sm text-gray-700 hover:bg-gray-50"><Icon size={14} className="text-gray-400" />{label}</button>
              ))}
            </div>
          </div>
          <div className="card bg-amber-50 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-amber-800"><Lightbulb size={16} />Sugestão da IA</h2>
            {contact.status === 'active' && <p className="mt-2 text-sm text-amber-700">Cliente fiel! Considere um programa de fidelidade ou desconto progressivo para manter o engajamento.</p>}
            {contact.status === 'cooling' && <p className="mt-2 text-sm text-amber-700">Não compra há mais de 30 dias. Envie uma mensagem personalizada perguntando se está tudo bem.</p>}
            {contact.status === 'lost' && <p className="mt-2 text-sm text-amber-700">Sem compras há mais de 60 dias. Uma oferta de 15% pode ser o incentivo para trazê-lo de volta.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

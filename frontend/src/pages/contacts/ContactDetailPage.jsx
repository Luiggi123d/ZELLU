import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Megaphone, Tag, StickyNote, Send, Lightbulb } from 'lucide-react';
import { getStatusLabel, getStatusColor, formatDate, timeAgo } from '../../lib/mockData';
import { supabase } from '../../lib/supabase';
import { deriveContactStatus, formatPhoneFromDigits } from '../../lib/dataHelpers';
import { SkeletonCard } from '../../components/ui/Skeleton';

export default function ContactDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.from('contacts').select('*').eq('id', id).single();
      if (cancelled) return;
      if (err) setError(err.message);
      else setContact({ ...data, status: deriveContactStatus(data) });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400">{error ? `Erro: ${error}` : 'Contato não encontrado'}</p>
        <Link to="/contacts" className="mt-4 inline-block text-zellu-600 hover:underline">Voltar para contatos</Link>
      </div>
    );
  }

  const initials = (contact.name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('');
  const tags = contact.tags || [];

  return (
    <div className="space-y-6">
      <Link to="/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-zellu-600"><ArrowLeft size={16} />Voltar para contatos</Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zellu-100 text-xl font-bold text-zellu-700">{initials}</div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{contact.name || '(sem nome)'}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contact.status)}`}>{getStatusLabel(contact.status)}</span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                <span>{formatPhoneFromDigits(contact.phone)}</span>
                {contact.email && <span>{contact.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 hover:bg-gray-50"><Send size={14} />Enviar mensagem</button>
            <button className="flex h-10 items-center rounded-lg bg-zellu-600 px-4 text-sm font-medium text-white hover:bg-zellu-700">Editar</button>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => <span key={tag} className="rounded-full bg-zellu-50 px-3 py-1 text-xs font-medium text-zellu-700">{tag}</span>)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500">Total de compras</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{contact.total_purchases || 0}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500">Última compra</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{contact.last_purchase_at ? timeAgo(contact.last_purchase_at) : '—'}</p>
              {contact.last_purchase_at && <p className="mt-1 text-xs text-gray-400">{formatDate(contact.last_purchase_at)}</p>}
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500">Cliente desde</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{contact.created_at ? formatDate(contact.created_at) : '—'}</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Histórico</h2>
            <p className="mt-3 text-sm text-gray-400">O histórico de compras e mensagens aparecerá aqui quando o WhatsApp estiver conectado.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Notas</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{contact.notes || 'Nenhuma nota registrada.'}</p>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Ações Rápidas</h2>
            <div className="mt-3 space-y-2">
              {[
                { icon: MessageSquare, label: 'Iniciar conversa no WhatsApp' },
                { icon: Megaphone, label: 'Incluir em campanha' },
                { icon: Tag, label: 'Editar tags' },
                { icon: StickyNote, label: 'Adicionar nota' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-4 text-left text-sm text-gray-700 hover:bg-gray-50">
                  <Icon size={14} className="text-gray-400" />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="card bg-amber-50 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-amber-800"><Lightbulb size={16} />Sugestão da IA</h2>
            {contact.status === 'active' && <p className="mt-2 text-sm text-amber-700">Cliente ativo! Mantenha o contato com lembretes e ofertas personalizadas.</p>}
            {contact.status === 'observation' && <p className="mt-2 text-sm text-amber-700">Cliente em observação. Uma mensagem de acompanhamento pode fortalecer o vínculo.</p>}
            {contact.status === 'cooling' && <p className="mt-2 text-sm text-amber-700">Não compra há mais de 30 dias. Envie uma mensagem personalizada perguntando se está tudo bem.</p>}
            {contact.status === 'lost' && <p className="mt-2 text-sm text-amber-700">Sem compras há mais de 60 dias. Uma oferta de 15% pode ser o incentivo para trazê-lo de volta.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

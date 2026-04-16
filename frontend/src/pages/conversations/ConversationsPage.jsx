import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Send, MessageSquare, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { formatPhoneFromDigits } from '../../lib/dataHelpers';
import { timeAgo } from '../../lib/mockData';
import { SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

const statusStyles = {
  open: 'bg-amber-100 text-amber-700',
  pending: 'bg-red-100 text-red-700',
  closed: 'bg-emerald-100 text-emerald-700',
};
const statusLabels = { open: 'Aberta', pending: 'Pendente', closed: 'Resolvida' };

function initialsOf(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ConversationsPage() {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  const loadConversations = useCallback(async () => {
    const pid = profile?.pharmacy_id;
    if (!pid) { setLoading(false); return; }
    // Stale-while-revalidate: so mostra skeleton se nao tem dados ainda
    if (conversations.length === 0) setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('conversations')
      .select('*, contacts(id, name, phone)')
      .eq('pharmacy_id', pid)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (err) setError(err.message);
    else {
      setConversations(data || []);
      if ((data || []).length > 0) setSelected((prev) => prev || data[0]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Rebusca ao voltar para a aba, ganhar foco ou token renovado
  useRefetchOnFocus(loadConversations, !!pharmacyId);

  // Realtime subscription — refresh conversation list when anything changes.
  useEffect(() => {
    if (!pharmacyId) return;
    const channel = supabase
      .channel(`conversations-${pharmacyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, async () => {
        const { data } = await supabase
          .from('conversations')
          .select('*, contacts(id, name, phone)')
          .eq('pharmacy_id', pharmacyId)
          .order('last_message_at', { ascending: false, nullsFirst: false });
        setConversations(data || []);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pharmacyId]);

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      if (!selected?.id) { setMessages([]); return; }
      setLoadingMessages(true);
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('conversation_id', selected.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (!err) setMessages(data || []);
      setLoadingMessages(false);
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [selected?.id]);

  // Realtime subscription for messages in the currently-selected conversation.
  useEffect(() => {
    if (!selected?.id) return;
    const channel = supabase
      .channel(`messages-${selected.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => (c.contacts?.name || '').toLowerCase().includes(q));
  }, [conversations, search]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3rem)] card overflow-hidden">
        <div className="w-[40%] p-4"><SkeletonList items={6} /></div>
        <div className="w-[60%] bg-gray-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">Erro ao carregar conversas: {error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
          <p className="text-sm text-gray-500">Atendimento centralizado do WhatsApp</p>
        </div>
        <div className="card p-6">
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma conversa ainda"
            description="As mensagens recebidas no WhatsApp da sua farmácia aparecerão aqui automaticamente. Conecte seu número para começar."
            ctaLabel="Conectar WhatsApp"
            ctaTo="/configuracoes"
            ctaIcon={Wifi}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-0 overflow-hidden card">
      <div className="flex w-[40%] flex-col border-r border-gray-200">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-zellu-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Nenhuma conversa encontrada</p>
          ) : (
            filtered.map((conv) => {
              const contact = conv.contacts || {};
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`flex cursor-pointer gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${selected?.id === conv.id ? 'bg-zellu-50' : ''}`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zellu-100 text-sm font-bold text-zellu-700">
                    {initialsOf(contact.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-medium text-gray-900">{contact.name || formatPhoneFromDigits(contact.phone) || 'Sem nome'}</p>
                      <span className="flex-shrink-0 text-xs text-gray-400">{conv.last_message_at ? timeAgo(conv.last_message_at) : ''}</span>
                    </div>
                    <p className="truncate text-sm text-gray-500">{formatPhoneFromDigits(contact.phone)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[conv.status] || statusStyles.open}`}>
                      {statusLabels[conv.status] || conv.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex w-[60%] flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zellu-100 text-sm font-bold text-zellu-700">
                  {initialsOf(selected.contacts?.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.contacts?.name || 'Sem nome'}</p>
                  <p className="text-xs text-gray-500">{formatPhoneFromDigits(selected.contacts?.phone)}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selected.status] || statusStyles.open}`}>
                {statusLabels[selected.status] || selected.status}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-6">
              {loadingMessages ? (
                <p className="text-center text-sm text-gray-400">Carregando mensagens...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400">Nenhuma mensagem nesta conversa ainda</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.direction === 'outbound' ? 'rounded-br-md bg-emerald-100 text-gray-800' : 'rounded-bl-md bg-white text-gray-800'}`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${msg.direction === 'outbound' ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {msg.created_at ? timeAgo(msg.created_at) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-zellu-500 focus:outline-none"
                />
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zellu-600 text-white hover:bg-zellu-700">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}

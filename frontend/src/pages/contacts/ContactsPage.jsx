import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Wifi, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockContacts, getStatusLabel, getStatusColor, timeAgo } from '../../lib/mockData';
import { SkeletonTable, useSkeletonLoading } from '../../components/ui/Skeleton';

const ITEMS_PER_PAGE = 10;

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos', count: mockContacts.length },
  { value: 'active', label: 'Ativos', count: mockContacts.filter((c) => c.status === 'active').length },
  { value: 'cooling', label: 'Esfriando', count: mockContacts.filter((c) => c.status === 'cooling').length },
  { value: 'lost', label: 'Perdidos', count: mockContacts.filter((c) => c.status === 'lost').length },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Wifi size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Nenhum contato ainda</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-gray-500">Conecte seu WhatsApp para importar contatos automaticamente e começar a gerenciar seus clientes.</p>
      <Link to="/configuracoes" className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-zellu-600 px-5 text-sm font-medium text-white hover:bg-zellu-700"><Wifi size={16} />Conectar WhatsApp</Link>
    </div>
  );
}

export default function ContactsPage() {
  const loading = useSkeletonLoading();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = mockContacts;
    if (statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.medications?.some((m) => m.toLowerCase().includes(q))
      );
    }
    return result;
  }, [statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  useMemo(() => setPage(1), [statusFilter, search]);

  if (loading) {
    return <div className="space-y-6"><div className="flex gap-2">{[1,2,3,4].map(i => <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-gray-200" />)}</div><SkeletonTable rows={8} cols={4} /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Contatos</h1><p className="text-sm text-gray-500">{mockContacts.length} clientes cadastrados</p></div>
        <button className="flex h-10 items-center gap-2 rounded-lg bg-zellu-600 px-4 text-sm font-medium text-white hover:bg-zellu-700"><Plus size={16} />Novo Contato</button>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map(({ value, label, count }) => (
          <button key={value} onClick={() => setStatusFilter(value)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${statusFilter === value ? 'bg-zellu-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label} <span className={statusFilter === value ? 'text-zellu-200' : 'text-gray-400'}>{count}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome, telefone ou medicamento..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Última compra</th>
                  <th className="px-6 py-3">Telefone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/contacts/${contact.id}`} className="block">
                        <p className="font-medium text-gray-900 hover:text-zellu-600">{contact.name}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contact.status)}`}>{getStatusLabel(contact.status)}</span>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-600">{timeAgo(contact.last_purchase_at)}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-500">{contact.phone}</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-zellu-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

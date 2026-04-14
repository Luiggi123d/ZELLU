import { Link } from 'react-router-dom';
import { Wifi } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Wifi,
  title = 'Nenhum dado ainda',
  description = 'Conecte seu WhatsApp para começar a receber dados automaticamente.',
  ctaLabel = 'Conectar WhatsApp',
  ctaTo = '/configuracoes',
  ctaIcon: CtaIcon = Wifi,
  compact = false,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-20'}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-zellu-600 px-5 text-sm font-medium text-white hover:bg-zellu-700"
        >
          <CtaIcon size={16} />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

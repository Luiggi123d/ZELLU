import { Link } from 'react-router-dom';
import { Wifi, Inbox } from 'lucide-react';
import { useWhatsappStore } from '../../store/whatsappStore';

/**
 * EmptyState shown across the app when a resource has no data.
 *
 * By default it assumes "no data" means "user needs to connect WhatsApp"
 * and shows a CTA pointing to /configuracoes. But if the WhatsApp is
 * ALREADY connected (global store), we know the account just has no
 * data yet — so we swap the copy to "waiting for first messages" and
 * drop the CTA. This prevents the confusing state where every page tells
 * the user to connect WhatsApp even though it's already connected.
 *
 * Pass `whatsappAware={false}` to opt out (e.g. for search/filter empty
 * states that have nothing to do with WhatsApp).
 */
export default function EmptyState({
  icon: Icon = Wifi,
  title = 'Nenhum dado ainda',
  description = 'Conecte seu WhatsApp para começar a receber dados automaticamente.',
  ctaLabel = 'Conectar WhatsApp',
  ctaTo = '/configuracoes',
  ctaIcon: CtaIcon = Wifi,
  compact = false,
  whatsappAware = true,
  connectedTitle = 'Aguardando primeiras mensagens',
  connectedDescription = 'Seu WhatsApp está conectado! Assim que seus clientes enviarem mensagens, os dados aparecerão aqui automaticamente.',
}) {
  const waConnected = useWhatsappStore((s) => s.connected);
  const showConnectedVariant = whatsappAware && waConnected;

  const FinalIcon = showConnectedVariant ? Inbox : Icon;
  const finalTitle = showConnectedVariant ? connectedTitle : title;
  const finalDescription = showConnectedVariant ? connectedDescription : description;
  const finalCtaLabel = showConnectedVariant ? null : ctaLabel;
  const finalCtaTo = showConnectedVariant ? null : ctaTo;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-20'}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <FinalIcon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{finalTitle}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{finalDescription}</p>
      {finalCtaLabel && finalCtaTo && (
        <Link
          to={finalCtaTo}
          className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-zellu-600 px-5 text-sm font-medium text-white hover:bg-zellu-700"
        >
          <CtaIcon size={16} />
          {finalCtaLabel}
        </Link>
      )}
    </div>
  );
}

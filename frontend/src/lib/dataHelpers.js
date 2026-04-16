// ============================================================
// Zellu — Helpers de classificação e derivação de dados reais
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Classifies a contact based on days since last purchase.
 * - active:     0–14 days
 * - observation: 15–29 days
 * - cooling:    30–59 days
 * - lost:       60+ days OR never purchased
 */
export function deriveContactStatus(contact) {
  if (!contact?.last_purchase_at) return 'lost';
  const days = Math.floor((Date.now() - new Date(contact.last_purchase_at).getTime()) / DAY_MS);
  if (days < 15) return 'active';
  if (days < 30) return 'observation';
  if (days < 60) return 'cooling';
  return 'lost';
}

export function daysSince(dateString) {
  if (!dateString) return null;
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / DAY_MS);
  if (isNaN(days) || days < 0) return null;
  return days;
}

/**
 * Splits contacts into radar buckets based on classification.
 */
export function classifyForRadar(contacts = []) {
  if (!contacts || !Array.isArray(contacts)) return { lost: [], cooling: [], observation: [], active: [] };
  const buckets = { lost: [], cooling: [], observation: [], active: [] };
  for (const c of contacts) {
    // Ignora contatos sem nenhuma data de referência
    if (!c.last_purchase_at && !c.updated_at) continue;
    const status = deriveContactStatus(c);
    buckets[status].push({ ...c, status, days: daysSince(c.last_purchase_at) });
  }
  // sort each bucket by days desc (most urgent first)
  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));
  }
  return buckets;
}

/**
 * Computes pharmacy-wide KPIs from real data.
 */
export function computeDashboardMetrics({ contacts = [], campaigns = [] } = {}) {
  if (!contacts || !Array.isArray(contacts)) contacts = [];
  if (!campaigns || !Array.isArray(campaigns)) campaigns = [];
  const total = contacts.length;
  const classified = classifyForRadar(contacts);
  const atRisk = classified.lost.length + classified.cooling.length;
  const pendingCampaigns = campaigns.filter((c) => c.status === 'draft' || c.status === 'scheduled').length;
  // Revenue at risk = at-risk contacts × their historical avg (fallback: 150)
  const revenueAtRisk = [...classified.lost, ...classified.cooling].reduce(
    (sum, c) => sum + (Number(c.avg_ticket) || Number(c.total_spent) / Math.max(1, c.total_purchases || 1) || 150),
    0
  );
  return {
    total,
    atRisk,
    pendingCampaigns,
    revenueAtRisk,
    active: classified.active.length + classified.observation.length,
    cooling: classified.cooling.length,
    lost: classified.lost.length,
    urgentClients: [...classified.lost, ...classified.cooling].slice(0, 3),
  };
}

export function formatPhoneFromDigits(digits) {
  if (!digits) return '';
  let d = String(digits).replace(/\D/g, '');

  // Remove codigo do pais (55) se presente
  if (d.startsWith('55') && d.length >= 12) {
    d = d.slice(2);
  }

  // Celular: (XX) 9XXXX-XXXX
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  // Fixo: (XX) XXXX-XXXX
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

  // Fallback: mostra com +55 se parece BR
  if (digits.length > 11) return `+${String(digits).replace(/\D/g, '')}`;
  return digits;
}

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
  return Math.floor((Date.now() - new Date(dateString).getTime()) / DAY_MS);
}

/**
 * Splits contacts into radar buckets based on classification.
 */
export function classifyForRadar(contacts = []) {
  if (!contacts || !Array.isArray(contacts)) return { lost: [], cooling: [], observation: [], active: [] };
  const buckets = { lost: [], cooling: [], observation: [], active: [] };
  for (const c of contacts) {
    const status = deriveContactStatus(c);
    buckets[status].push({ ...c, status, days: daysSince(c.last_purchase_at) });
  }
  // sort each bucket by days desc (most urgent first)
  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
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
  const d = String(digits).replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

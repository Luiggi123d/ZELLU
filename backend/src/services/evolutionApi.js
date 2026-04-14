const env = require('../config/env');

// ============================================================
// Evolution API client
// Docs: https://doc.evolution-api.com/v2/
// ============================================================

const BASE_URL = (env.evolutionApiUrl || '').replace(/\/+$/, '');

function headers() {
  if (!env.evolutionApiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada no backend');
  }
  return {
    'Content-Type': 'application/json',
    apikey: env.evolutionApiKey,
  };
}

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Evolution API error ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

function instanceNameFor(pharmacyId) {
  return `zellu-${pharmacyId}`;
}

function webhookUrl() {
  return `${(env.backendPublicUrl || '').replace(/\/+$/, '')}/api/whatsapp/webhook`;
}

// ============================================================
// Endpoints
// ============================================================

/**
 * Creates an instance and returns the QR code (base64).
 * If the instance already exists, falls back to connecting.
 */
async function createInstance(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);

  try {
    const data = await request('POST', '/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: webhookUrl(),
        byEvents: false,
        base64: true,
        events: ['CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'QRCODE_UPDATED'],
      },
    });
    return normalizeQrResponse(data, instanceName);
  } catch (err) {
    // If it already exists (409 / 403), ensure webhook is set then fetch a fresh QR
    if (err.status === 409 || err.status === 403 || /already in use|exists/i.test(err.message)) {
      await setWebhook(pharmacyId).catch(() => {});
      return connectInstance(pharmacyId);
    }
    throw err;
  }
}

/**
 * Returns current webhook config for an instance.
 */
async function getWebhookInfo(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);
  try {
    const data = await request('GET', `/webhook/find/${encodeURIComponent(instanceName)}`);
    const currentUrl = data?.url || data?.webhook?.url || null;
    return {
      instanceName,
      currentUrl,
      expectedUrl: webhookUrl(),
      ok: currentUrl === webhookUrl(),
      raw: data,
    };
  } catch (err) {
    return { instanceName, error: err.message, expectedUrl: webhookUrl() };
  }
}

/**
 * Forces webhook URL/events for an existing instance.
 */
async function setWebhook(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);
  const data = await request('POST', `/webhook/set/${encodeURIComponent(instanceName)}`, {
    url: webhookUrl(),
    byEvents: false,
    base64: true,
    events: ['CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'QRCODE_UPDATED'],
  });
  console.log(`[evolutionApi] webhook configurado: ${webhookUrl()}`);
  return data;
}

/**
 * Re-fetches QR for an existing instance.
 */
async function connectInstance(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);
  const data = await request('GET', `/instance/connect/${encodeURIComponent(instanceName)}`);
  return normalizeQrResponse(data, instanceName);
}

function normalizeQrResponse(data, instanceName) {
  // Evolution API returns QR code under different shapes depending on endpoint/version.
  // Possible locations: data.qrcode.base64, data.base64, data.qrcode (string), data.qr, data.code
  const qrcode =
    data?.qrcode?.base64 ||
    data?.base64 ||
    (typeof data?.qrcode === 'string' ? data.qrcode : null) ||
    data?.qr ||
    data?.code ||
    null;
  const pairingCode = data?.qrcode?.pairingCode || data?.pairingCode || null;
  return { instanceName, qrcode, pairingCode, raw: data };
}

/**
 * Returns connection state of an instance.
 * Possible states: open (connected), close (disconnected), connecting
 */
async function getConnectionState(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);
  try {
    const data = await request('GET', `/instance/connectionState/${encodeURIComponent(instanceName)}`);
    // Shape: { instance: { instanceName, state: 'open'|'close'|'connecting' } }
    const state = data?.instance?.state || data?.state || 'close';
    return { instanceName, state, raw: data };
  } catch (err) {
    if (err.status === 404) return { instanceName, state: 'not_found', raw: null };
    throw err;
  }
}

/**
 * Fetches instance details (phone, profile, etc).
 */
async function fetchInstances(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);
  const data = await request('GET', `/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`);
  const list = Array.isArray(data) ? data : (data?.instances || []);
  const first = list[0] || null;
  // Common shapes: { instance: { instanceName, ... }, ... } or flat
  const inst = first?.instance || first;
  const phone =
    inst?.ownerJid?.split('@')[0] ||
    inst?.owner?.split('@')[0] ||
    inst?.number ||
    inst?.profileName && inst?.phone ||
    null;
  return { instanceName, phone, raw: first };
}

/**
 * Deletes an instance. Tries logout first so Baileys disconnects cleanly.
 */
async function deleteInstance(pharmacyId) {
  const instanceName = instanceNameFor(pharmacyId);
  // Best-effort logout first
  try {
    await request('DELETE', `/instance/logout/${encodeURIComponent(instanceName)}`);
  } catch (_) {
    /* ignore — instance may not be connected */
  }
  try {
    await request('DELETE', `/instance/delete/${encodeURIComponent(instanceName)}`);
    return { deleted: true };
  } catch (err) {
    if (err.status === 404) return { deleted: false, reason: 'not_found' };
    throw err;
  }
}

module.exports = {
  instanceNameFor,
  webhookUrl,
  createInstance,
  connectInstance,
  getConnectionState,
  fetchInstances,
  deleteInstance,
  getWebhookInfo,
  setWebhook,
};

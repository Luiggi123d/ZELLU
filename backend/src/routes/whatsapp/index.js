const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { requireAuth, requirePharmacy } = require('../../middleware/auth');
const evolution = require('../../services/evolutionApi');

const router = Router();

// ============================================================
// In-memory status cache (per pharmacy) — reduces pressure on
// Evolution API when multiple components poll /status.
// ============================================================
const statusCache = new Map();
const STATUS_TTL = 15_000;

function getCached(pharmacyId) {
  const entry = statusCache.get(pharmacyId);
  if (!entry) return null;
  if (Date.now() - entry.ts > STATUS_TTL) {
    statusCache.delete(pharmacyId);
    return null;
  }
  return entry.data;
}

function setCache(pharmacyId, data) {
  statusCache.set(pharmacyId, { data, ts: Date.now() });
}

function invalidateCache(pharmacyId) {
  statusCache.delete(pharmacyId);
}

// ============================================================
// POST /api/whatsapp/connect
// Creates (or refreshes) an Evolution API instance for the user's
// pharmacy and returns the QR code in base64.
// ============================================================
router.post('/connect', requireAuth, requirePharmacy, async (req, res, next) => {
  try {
    const pharmacyId = req.pharmacyId;
    const instanceName = evolution.instanceNameFor(pharmacyId);

    // Create instance on Evolution API (idempotent — falls back to /connect on conflict)
    const { qrcode, pairingCode } = await evolution.createInstance(pharmacyId);

    // A new QR means stale status; nuke cache
    invalidateCache(pharmacyId);

    // Upsert local record
    await supabaseAdmin
      .from('whatsapp_instances')
      .upsert(
        {
          pharmacy_id: pharmacyId,
          instance_name: instanceName,
          status: 'connecting',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'pharmacy_id' }
      );

    return res.json({
      instanceName,
      qrcode, // data URL or raw base64, depending on Evolution response
      pairingCode,
      status: 'connecting',
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/whatsapp/status
// Checks connection state on Evolution API AND returns cached row.
// ============================================================
router.get('/status', requireAuth, requirePharmacy, async (req, res, next) => {
  try {
    const pharmacyId = req.pharmacyId;

    // Serve from cache if fresh
    const cached = getCached(pharmacyId);
    if (cached) {
      return res.json(cached);
    }

    const { data: row } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .maybeSingle();

    if (!row) {
      const payload = { connected: false, state: 'not_found', phone: null };
      setCache(pharmacyId, payload);
      return res.json(payload);
    }

    let state = 'close';
    try {
      const r = await evolution.getConnectionState(pharmacyId);
      state = r.state;
    } catch (_) {
      /* fall through to cached value */
    }

    const connected = state === 'open';
    let phone = row.phone_number;

    // When newly connected, fetch profile to grab phone number
    if (connected && !phone) {
      try {
        const info = await evolution.fetchInstances(pharmacyId);
        phone = info.phone || null;
      } catch (_) { /* ignore */ }
    }

    // Update cached row if state changed
    if (row.status !== (connected ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected')) {
      await supabaseAdmin
        .from('whatsapp_instances')
        .update({
          status: connected ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected',
          phone_number: phone || row.phone_number,
          connected_at: connected && !row.connected_at ? new Date().toISOString() : row.connected_at,
          updated_at: new Date().toISOString(),
        })
        .eq('pharmacy_id', pharmacyId);
    }

    const payload = {
      connected,
      state,
      phone: phone || null,
      instanceName: row.instance_name,
    };
    setCache(pharmacyId, payload);
    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/whatsapp/fix-webhook
// Forces Evolution API to re-register the webhook URL/events for
// this pharmacy's instance. Useful when the instance was created
// before the webhook config was correct.
// ============================================================
router.post('/fix-webhook', requireAuth, requirePharmacy, async (req, res, next) => {
  try {
    const data = await evolution.setWebhook(req.pharmacyId);
    return res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/whatsapp/webhook-info
// Returns the current webhook config reported by Evolution API,
// plus the expected URL so we can diagnose mismatches.
// ============================================================
router.get('/webhook-info', requireAuth, requirePharmacy, async (req, res, next) => {
  try {
    const info = await evolution.getWebhookInfo(req.pharmacyId);
    return res.json(info);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE /api/whatsapp/disconnect
// Logs out and deletes the Evolution API instance for this pharmacy.
// ============================================================
router.delete('/disconnect', requireAuth, requirePharmacy, async (req, res, next) => {
  try {
    const pharmacyId = req.pharmacyId;

    try {
      await evolution.deleteInstance(pharmacyId);
    } catch (err) {
      // Only propagate real errors; "not found" is fine.
      if (err.status && err.status !== 404) throw err;
    }

    await supabaseAdmin
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        phone_number: null,
        connected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('pharmacy_id', pharmacyId);

    invalidateCache(pharmacyId);

    return res.json({ disconnected: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/whatsapp/webhook
// Public endpoint — receives events from Evolution API.
// NOTE: Evolution API does not sign webhooks; we identify the tenant
// by parsing the instance name (`zellu-{pharmacyId}`).
// ============================================================
router.post('/webhook', async (req, res) => {
  // Always 200 fast so Evolution doesn't retry
  res.status(200).json({ received: true });

  const body = req.body || {};
  console.log('[webhook] RECEBIDO:', JSON.stringify({
    event: body.event || body.type,
    instance: body.instance || body.instanceName,
    dataKeys: body.data ? Object.keys(body.data) : [],
    raw: JSON.stringify(body).slice(0, 500),
  }));

  try {
    // Payload shapes we handle:
    //  { event, instance, data, ... }
    //  { event: 'CONNECTION_UPDATE', instance: 'zellu-xxx', data: { state, ... } }
    //  { event: 'MESSAGES_UPSERT', instance: 'zellu-xxx', data: { key, message, pushName, ... } }
    const event = body.event || body.type;
    const instanceName = body.instance || body.instanceName || body.instance_name;
    const data = body.data || body.payload || body;

    if (!instanceName || !event) return;

    const pharmacyId = parsePharmacyId(instanceName);
    if (!pharmacyId) return;

    console.log(`[whatsapp webhook] event=${event} instance=${instanceName}`);

    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      await handleConnectionUpdate(pharmacyId, instanceName, data);
    } else if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
      await handleMessagesUpsert(pharmacyId, instanceName, data);
    }
  } catch (err) {
    console.error('[whatsapp webhook] error:', err.message);
  }
});

function parsePharmacyId(instanceName) {
  if (typeof instanceName !== 'string') return null;
  const m = instanceName.match(/^zellu-(.+)$/);
  return m ? m[1] : null;
}

async function handleConnectionUpdate(pharmacyId, instanceName, data) {
  // data shape: { state: 'open'|'close'|'connecting', ... } or wrapped
  const state = data?.state || data?.connection || data?.status;
  const connected = state === 'open' || state === 'connected';

  let phone = null;
  if (connected) {
    try {
      const info = await require('../../services/evolutionApi').fetchInstances(pharmacyId);
      phone = info.phone || null;
    } catch (_) { /* ignore */ }
  }

  await supabaseAdmin
    .from('whatsapp_instances')
    .upsert(
      {
        pharmacy_id: pharmacyId,
        instance_name: instanceName,
        status: connected ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected',
        phone_number: connected ? phone : null,
        connected_at: connected ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pharmacy_id' }
    );

  invalidateCache(pharmacyId);
}

async function handleMessagesUpsert(pharmacyId, instanceName, data) {
  // data shape varies; normalize to an array of messages
  const messages = Array.isArray(data) ? data : (data?.messages || (data?.key ? [data] : []));
  if (messages.length === 0) return;

  // Get whatsapp_instances row (for instance id reference)
  const { data: inst } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('id')
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle();

  for (const msg of messages) {
    try {
      const remoteJid = msg?.key?.remoteJid || msg?.remoteJid;
      if (!remoteJid) continue;
      // Skip group chats for now
      if (remoteJid.includes('@g.us')) continue;

      const fromMe = !!(msg?.key?.fromMe);
      const phone = remoteJid.split('@')[0];
      const pushName = msg?.pushName || null;
      const content = extractMessageContent(msg?.message);
      const externalId = msg?.key?.id || null;
      const timestamp = msg?.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      // Upsert contact
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .upsert(
          {
            pharmacy_id: pharmacyId,
            phone,
            name: pushName || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'pharmacy_id,phone' }
        )
        .select()
        .single();

      if (!contact) continue;

      // Upsert conversation (one open conversation per contact)
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId = existingConv?.id;
      if (!conversationId) {
        const { data: newConv } = await supabaseAdmin
          .from('conversations')
          .insert({
            pharmacy_id: pharmacyId,
            contact_id: contact.id,
            whatsapp_instance_id: inst?.id || null,
            status: 'open',
            last_message_at: timestamp,
            unread_count: fromMe ? 0 : 1,
          })
          .select()
          .single();
        conversationId = newConv?.id;
      } else {
        await supabaseAdmin
          .from('conversations')
          .update({
            last_message_at: timestamp,
            unread_count: fromMe ? 0 : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }

      if (!conversationId) continue;

      // Insert message (dedupe on external_id if present)
      if (externalId) {
        const { data: dupe } = await supabaseAdmin
          .from('messages')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();
        if (dupe) continue;
      }

      await supabaseAdmin.from('messages').insert({
        pharmacy_id: pharmacyId,
        conversation_id: conversationId,
        contact_id: contact.id,
        direction: fromMe ? 'outbound' : 'inbound',
        content,
        status: 'delivered',
        external_id: externalId,
        created_at: timestamp,
      });
    } catch (err) {
      console.error('[whatsapp webhook] message save error:', err.message);
    }
  }
}

function extractMessageContent(message) {
  if (!message) return null;
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.listResponseMessage?.title ||
    '[mídia]'
  );
}

// ============================================================
// GET /api/whatsapp/debug-webhook — TEMPORÁRIO, remover depois
// Lista o webhook configurado para cada instância no banco.
// ============================================================
router.get('/debug-webhook', async (_req, res) => {
  const env = require('../../config/env');

  const { data: instances } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*');

  const results = [];
  for (const inst of (instances || [])) {
    try {
      const info = await evolution.getWebhookInfo(inst.pharmacy_id);
      results.push({
        pharmacy_id: inst.pharmacy_id,
        instance_name: inst.instance_name,
        status: inst.status,
        ...info,
      });
    } catch (err) {
      results.push({ pharmacy_id: inst.pharmacy_id, error: err.message });
    }
  }

  return res.json({
    backendPublicUrl: env.backendPublicUrl,
    expectedWebhookUrl: `${(env.backendPublicUrl || '').replace(/\/+$/, '')}/api/whatsapp/webhook`,
    instances: results,
  });
});

module.exports = router;

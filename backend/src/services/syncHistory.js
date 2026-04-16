const { supabaseAdmin } = require('../config/supabase');
const evolution = require('./evolutionApi');

// ============================================================
// Pulls historical chats + messages from Evolution API and
// upserts them into Supabase (contacts, conversations, messages).
//
// Handles LID-based JIDs by resolving the real phone number
// from lastMessage.key.remoteJidAlt. Deduplicates contacts
// that appear as both LID and @s.whatsapp.net chats.
// ============================================================

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
    '[midia]'
  );
}

/**
 * Valida se um nome e realmente um nome humano e nao um numero de telefone.
 * A Evolution API as vezes retorna o numero como "name" ou "pushName".
 */
function isValidContactName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  // Se e so digitos (com ou sem espacos/hifens/+), nao e nome
  if (/^[\d\s\-+().]+$/.test(trimmed)) return false;
  // Se parece com JID (contem @)
  if (trimmed.includes('@')) return false;
  return true;
}

/**
 * Extracts phone digits from a @s.whatsapp.net JID.
 * Returns null if the JID is not a valid individual contact.
 */
function phoneFromWhatsAppJid(jid) {
  if (!jid || typeof jid !== 'string') return null;
  if (!jid.includes('@s.whatsapp.net')) return null;
  const digits = jid.split('@')[0].replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * Resolves a chat to its real @s.whatsapp.net JID and phone number.
 * Handles both direct @s.whatsapp.net chats and LID chats
 * (where the real JID is in lastMessage.key.remoteJidAlt).
 *
 * Returns { phone, whatsappJid, name } or null if unresolvable.
 */
function resolveChat(chat) {
  const remoteJid = chat.remoteJid || chat.id || '';

  // Skip groups, broadcasts, newsletters
  if (/@g\.us|@broadcast|@newsletter/i.test(remoteJid)) return null;

  let whatsappJid = null;

  if (remoteJid.includes('@s.whatsapp.net')) {
    // Direct @s.whatsapp.net chat
    whatsappJid = remoteJid;
  } else if (remoteJid.includes('@lid')) {
    // LID chat — resolve via lastMessage.key.remoteJidAlt
    const alt = chat.lastMessage?.key?.remoteJidAlt;
    if (alt && alt.includes('@s.whatsapp.net')) {
      whatsappJid = alt;
    } else {
      // No remoteJidAlt available — cannot resolve this LID
      return null;
    }
  } else {
    // Unknown JID type
    return null;
  }

  const phone = phoneFromWhatsAppJid(whatsappJid);
  if (!phone) return null;

  // Extract contact name from lastMessage.pushName (NOT chat.pushName which is always null)
  let name = null;
  const lastMsgPushName = chat.lastMessage?.pushName;
  // If fromMe, pushName will be the pharmacy's own name (e.g. "Voce") — skip it
  const isFromMe = chat.lastMessage?.key?.fromMe;
  if (!isFromMe && isValidContactName(lastMsgPushName)) {
    name = lastMsgPushName.trim();
  }

  return { phone, whatsappJid, originalJid: remoteJid, name };
}

/**
 * Deduplicates chats by phone number.
 * If the same phone appears as both a LID chat and a @s.whatsapp.net chat,
 * we keep the one that has the best data (name, most recent message).
 *
 * Returns a Map of phone -> { phone, whatsappJid, name }
 */
function deduplicateChats(chats) {
  const byPhone = new Map();

  for (const chat of chats) {
    const resolved = resolveChat(chat);
    if (!resolved) continue;

    const existing = byPhone.get(resolved.phone);
    if (!existing) {
      byPhone.set(resolved.phone, resolved);
    } else {
      // Merge: prefer the entry that has a name
      if (!existing.name && resolved.name) {
        existing.name = resolved.name;
      }
      // Always prefer the @s.whatsapp.net JID for fetching messages
      if (resolved.whatsappJid.includes('@s.whatsapp.net')) {
        existing.whatsappJid = resolved.whatsappJid;
      }
    }
  }

  return byPhone;
}

/**
 * Extracts pushName from inbound messages (not fromMe).
 * Iterates from most recent to oldest, returns the first valid name found.
 */
function extractPushNameFromMessages(msgs) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i];
    if (msg?.key?.fromMe) continue;
    const name = msg?.pushName || msg?.verifiedBizName || null;
    if (isValidContactName(name)) {
      return name.trim();
    }
  }
  return null;
}

/**
 * Parses a message timestamp into an ISO string.
 * Returns null if the timestamp is invalid.
 */
function parseTimestamp(ts) {
  if (!ts) return null;
  const raw = Number(ts);
  if (isNaN(raw)) return null;
  const ms = raw > 1e12 ? raw : raw * 1000;
  const parsed = new Date(ms);
  // Sanity check: must be between 2020 and slightly in the future
  if (parsed.getFullYear() >= 2020 && parsed <= new Date(Date.now() + 60000)) {
    return parsed.toISOString();
  }
  return null;
}

// ============================================================
// Main sync function
// ============================================================

async function syncHistoryForPharmacy(pharmacyId, { messagesPerChat = 20 } = {}) {
  const result = {
    chats: 0,
    uniqueContacts: 0,
    contactsUpserted: 0,
    conversationsUpserted: 0,
    messagesInserted: 0,
    namesUpdated: 0,
    skippedLids: 0,
    errors: [],
  };

  // Get the WhatsApp instance for this pharmacy
  let instanceId = null;
  try {
    const { data: inst } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id')
      .eq('pharmacy_id', pharmacyId)
      .maybeSingle();
    instanceId = inst?.id || null;
  } catch (err) {
    console.warn(`[sync] Could not fetch whatsapp_instance for pharmacy ${pharmacyId}: ${err.message}`);
  }

  // Step 1: Fetch all chats
  let rawChats = [];
  try {
    rawChats = await evolution.findChats(pharmacyId);
  } catch (err) {
    result.errors.push(`findChats failed: ${err.message}`);
    console.error(`[sync] findChats failed for pharmacy ${pharmacyId}:`, err.message);
    return result;
  }

  result.chats = rawChats.length;
  console.log(`[sync] Farmacia ${pharmacyId}: ${rawChats.length} chats brutos encontrados`);

  // Step 1b: Fetch contacts from Evolution API (has pushName/display names)
  let contactNameMap = new Map(); // remoteJid -> pushName
  try {
    const evoContacts = await evolution.findContacts(pharmacyId);
    for (const c of evoContacts) {
      const jid = c.remoteJid || '';
      const name = c.pushName || c.name || null;
      if (jid && name && isValidContactName(name)) {
        contactNameMap.set(jid, name.trim());
      }
    }
    console.log(`[sync] ${contactNameMap.size} nomes encontrados via findContacts (de ${evoContacts.length} contatos)`);
  } catch (err) {
    console.warn(`[sync] findContacts failed (non-fatal): ${err.message}`);
  }

  // Step 2: Resolve and deduplicate chats
  const contactMap = deduplicateChats(rawChats);
  result.uniqueContacts = contactMap.size;
  result.skippedLids = rawChats.length - contactMap.size;

  console.log(`[sync] ${contactMap.size} contatos unicos apos deduplicacao (${result.skippedLids} chats ignorados/duplicados)`);

  // Step 3: Process each unique contact
  for (const [phone, chatInfo] of contactMap) {
    try {
      // --- Upsert contact ---
      const { data: existingContact } = await supabaseAdmin
        .from('contacts')
        .select('id, name')
        .eq('pharmacy_id', pharmacyId)
        .eq('phone', phone)
        .maybeSingle();

      // Resolve name: existing > findContacts (by whatsapp JID or original LID) > lastMessage.pushName
      const evoName = contactNameMap.get(chatInfo.whatsappJid)
        || contactNameMap.get(chatInfo.originalJid)
        || null;
      const contactName = (existingContact?.name && isValidContactName(existingContact.name))
        ? existingContact.name
        : (evoName || chatInfo.name);

      const { data: contact, error: contactErr } = await supabaseAdmin
        .from('contacts')
        .upsert(
          {
            pharmacy_id: pharmacyId,
            phone,
            name: contactName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'pharmacy_id,phone', ignoreDuplicates: false }
        )
        .select()
        .single();

      if (contactErr || !contact) {
        result.errors.push(`contact upsert ${phone}: ${contactErr?.message}`);
        continue;
      }
      result.contactsUpserted++;

      // --- Fetch messages using the @s.whatsapp.net JID (LID returns 0 messages) ---
      let msgs = [];
      try {
        msgs = await evolution.findMessages(pharmacyId, chatInfo.whatsappJid, messagesPerChat);
      } catch (err) {
        result.errors.push(`findMessages ${chatInfo.whatsappJid}: ${err.message}`);
      }

      // --- Try to extract pushName from messages if contact still has no name ---
      if (!isValidContactName(contact.name) && msgs.length > 0) {
        const msgPushName = extractPushNameFromMessages(msgs);
        if (msgPushName) {
          const { error: nameErr } = await supabaseAdmin
            .from('contacts')
            .update({ name: msgPushName, updated_at: new Date().toISOString() })
            .eq('id', contact.id);
          if (!nameErr) {
            contact.name = msgPushName;
            result.namesUpdated++;
          }
        }
      }

      // --- Find or create conversation ---
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId = existingConv?.id;

      // Determine last message timestamp
      const lastMsgTs = msgs.length > 0
        ? (parseTimestamp(msgs[msgs.length - 1]?.messageTimestamp) || new Date().toISOString())
        : new Date().toISOString();

      if (!conversationId) {
        const { data: newConv, error: convErr } = await supabaseAdmin
          .from('conversations')
          .insert({
            pharmacy_id: pharmacyId,
            contact_id: contact.id,
            whatsapp_instance_id: instanceId,
            status: 'open',
            last_message_at: lastMsgTs,
            unread_count: 0,
          })
          .select()
          .single();

        if (convErr) {
          result.errors.push(`conv insert ${phone}: ${convErr.message}`);
          continue;
        }
        conversationId = newConv?.id;
      } else {
        await supabaseAdmin
          .from('conversations')
          .update({ last_message_at: lastMsgTs, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
      result.conversationsUpserted++;

      // --- Insert messages (deduplicated by external_id) ---
      for (const msg of msgs) {
        try {
          const externalId = msg?.key?.id || null;
          if (!externalId) continue; // Skip messages without an ID

          // Check for duplicate
          const { data: dupe } = await supabaseAdmin
            .from('messages')
            .select('id')
            .eq('external_id', externalId)
            .maybeSingle();
          if (dupe) continue;

          const fromMe = !!(msg?.key?.fromMe);
          const content = extractMessageContent(msg?.message);
          const timestamp = parseTimestamp(msg?.messageTimestamp) || new Date().toISOString();

          const { error: msgErr } = await supabaseAdmin.from('messages').insert({
            pharmacy_id: pharmacyId,
            conversation_id: conversationId,
            contact_id: contact.id,
            direction: fromMe ? 'outbound' : 'inbound',
            content,
            status: 'delivered',
            external_id: externalId,
            created_at: timestamp,
          });

          if (msgErr) {
            result.errors.push(`message insert ${externalId}: ${msgErr.message}`);
          } else {
            result.messagesInserted++;
          }
        } catch (err) {
          result.errors.push(`message insert: ${err.message}`);
        }
      }
    } catch (err) {
      result.errors.push(`chat loop ${phone}: ${err.message}`);
    }
  }

  // --- Summary log ---
  console.log(
    `[sync] Resultado farmacia ${pharmacyId}: ` +
    `${result.contactsUpserted} contatos, ` +
    `${result.conversationsUpserted} conversas, ` +
    `${result.messagesInserted} msgs, ` +
    `${result.namesUpdated} nomes atualizados`
  );
  if (result.errors.length > 0) {
    console.warn(`[sync] ${result.errors.length} erros:`, result.errors.slice(0, 10));
  }

  return result;
}

module.exports = { syncHistoryForPharmacy };

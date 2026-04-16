const { supabaseAdmin } = require('../config/supabase');
const evolution = require('./evolutionApi');

// ============================================================
// Pulls historical chats + messages from Evolution API and
// upserts them into Supabase (contacts, conversations, messages).
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
 * Valida se um JID e um contato real (nao LID, grupo, broadcast, etc).
 * Retorna os digitos do telefone ou null se invalido.
 */
function phoneFromJid(jid) {
  if (!jid || typeof jid !== 'string') return null;
  // Rejeita JIDs que nao sao contatos individuais reais
  if (/@lid|@g\.us|@broadcast|@newsletter|@s\.whatsapp\.net.*:/i.test(jid)) {
    // O ultimo caso captura JIDs de status/grupos internos
  }
  if (!jid.includes('@s.whatsapp.net')) return null; // So aceita contatos individuais
  const digits = jid.split('@')[0].replace(/[^0-9]/g, '');
  // Telefone real: 8-15 digitos (cobre numeros internacionais)
  if (!digits || digits.length < 8 || digits.length > 15) return null;
  return digits;
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

async function syncHistoryForPharmacy(pharmacyId, { messagesPerChat = 20 } = {}) {
  const result = { chats: 0, contactsUpserted: 0, conversationsUpserted: 0, messagesInserted: 0, namesUpdated: 0, errors: [] };

  const { data: inst } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('id')
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle();

  let chats = [];
  try {
    chats = await evolution.findChats(pharmacyId);
  } catch (err) {
    result.errors.push(`findChats failed: ${err.message}`);
    return result;
  }

  result.chats = chats.length;
  console.log(`[sync] Farmacia ${pharmacyId}: ${chats.length} chats encontrados`);

  for (const chat of chats) {
    try {
      const remoteJid = chat.remoteJid || chat.id || chat.key?.remoteJid;
      if (!remoteJid) continue;

      const phone = phoneFromJid(remoteJid);
      if (!phone) continue;

      // Extrai pushName e valida que e um nome real (nao um numero)
      const rawName = chat.pushName || chat.name || chat.profileName || null;
      const pushName = isValidContactName(rawName) ? rawName.trim() : null;

      // Busca contato existente para nao sobrescrever nome ja salvo
      const { data: existingContact } = await supabaseAdmin
        .from('contacts')
        .select('id, name')
        .eq('pharmacy_id', pharmacyId)
        .eq('phone', phone)
        .maybeSingle();

      // Preserva nome existente; so grava pushName se nao tem nome ainda
      const contactName = (existingContact?.name && isValidContactName(existingContact.name))
        ? existingContact.name
        : pushName;

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

      // Fetch messages for this chat
      let msgs = [];
      try {
        msgs = await evolution.findMessages(pharmacyId, remoteJid, messagesPerChat);
      } catch (err) {
        result.errors.push(`findMessages ${remoteJid}: ${err.message}`);
      }

      // Se o contato AINDA nao tem nome valido, tenta extrair dos pushNames das mensagens
      if (!isValidContactName(contact.name) && msgs.length > 0) {
        const msgPushName = extractPushNameFromMessages(msgs);
        if (msgPushName) {
          await supabaseAdmin
            .from('contacts')
            .update({ name: msgPushName, updated_at: new Date().toISOString() })
            .eq('id', contact.id);
          contact.name = msgPushName;
          result.namesUpdated++;
        }
      }

      // Find or create conversation
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId = existingConv?.id;
      const lastMsgTs = msgs.length
        ? new Date(Number(msgs[msgs.length - 1]?.messageTimestamp || Date.now() / 1000) * 1000).toISOString()
        : new Date().toISOString();

      if (!conversationId) {
        const { data: newConv, error: convErr } = await supabaseAdmin
          .from('conversations')
          .insert({
            pharmacy_id: pharmacyId,
            contact_id: contact.id,
            whatsapp_instance_id: inst?.id || null,
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

      // Insert messages, deduped by external_id
      for (const msg of msgs) {
        try {
          const externalId = msg?.key?.id || msg?.id || null;
          if (externalId) {
            const { data: dupe } = await supabaseAdmin
              .from('messages')
              .select('id')
              .eq('external_id', externalId)
              .maybeSingle();
            if (dupe) continue;
          }

          const fromMe = !!(msg?.key?.fromMe);
          const content = extractMessageContent(msg?.message);
          let timestamp = new Date().toISOString();
          if (msg?.messageTimestamp) {
            const raw = Number(msg.messageTimestamp);
            const ms = raw > 1e12 ? raw : raw * 1000;
            const parsed = new Date(ms);
            if (parsed.getFullYear() >= 2020 && parsed <= new Date(Date.now() + 60000)) {
              timestamp = parsed.toISOString();
            }
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
          result.messagesInserted++;
        } catch (err) {
          result.errors.push(`message insert: ${err.message}`);
        }
      }
    } catch (err) {
      result.errors.push(`chat loop: ${err.message}`);
    }
  }

  console.log(`[sync] Resultado: ${result.contactsUpserted} contatos, ${result.conversationsUpserted} conversas, ${result.messagesInserted} msgs, ${result.namesUpdated} nomes atualizados`);
  if (result.errors.length > 0) console.warn(`[sync] Erros: ${result.errors.length}`, result.errors.slice(0, 5));

  return result;
}

/**
 * Extrai pushName de mensagens recebidas (nao fromMe).
 * Prioriza mensagens mais recentes.
 * Valida que o nome nao e um numero de telefone.
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

module.exports = { syncHistoryForPharmacy };

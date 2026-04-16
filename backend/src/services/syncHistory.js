const { supabaseAdmin } = require('../config/supabase');
const evolution = require('./evolutionApi');

// ============================================================
// Pulls historical chats + messages from Evolution API and
// upserts them into Supabase (contacts, conversations, messages).
//
// Agora tambem extrai pushName das mensagens para preencher
// o nome dos contatos que vieram sem nome do findChats.
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

function phoneFromJid(jid) {
  if (!jid || typeof jid !== 'string') return null;
  return jid.split('@')[0].replace(/[^0-9]/g, '') || null;
}

async function syncHistoryForPharmacy(pharmacyId, { messagesPerChat = 20 } = {}) {
  const result = { chats: 0, contactsUpserted: 0, conversationsUpserted: 0, messagesInserted: 0, namesUpdated: 0, errors: [] };

  // Get the whatsapp_instances row for this pharmacy (we need its id)
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

  for (const chat of chats) {
    try {
      const remoteJid = chat.remoteJid || chat.id || chat.key?.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) continue;

      const phone = phoneFromJid(remoteJid);
      if (!phone) continue;

      const pushName = chat.pushName || chat.name || chat.profileName || null;

      // Upsert contact (sem sobrescrever nome existente)
      const { data: contact, error: contactErr } = await supabaseAdmin
        .from('contacts')
        .upsert(
          {
            pharmacy_id: pharmacyId,
            phone,
            name: pushName || null,
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

      // Se o contato nao tem nome, tenta extrair dos pushNames das mensagens
      if (!contact.name && msgs.length > 0) {
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

  return result;
}

/**
 * Extrai pushName de mensagens recebidas (nao fromMe).
 * Prioriza mensagens mais recentes.
 */
function extractPushNameFromMessages(msgs) {
  // Itera de tras pra frente (mensagens mais recentes primeiro)
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i];
    if (msg?.key?.fromMe) continue; // Ignora mensagens enviadas
    const name = msg?.pushName || msg?.verifiedBizName || null;
    if (name && name.trim() && name.length > 1) {
      return name.trim();
    }
  }
  return null;
}

module.exports = { syncHistoryForPharmacy };

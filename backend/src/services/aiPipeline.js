const { supabaseAdmin } = require('../config/supabase');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001';

async function callClaude(system, user) {
  if (!ANTHROPIC_API_KEY) return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) { console.error('[aiPipeline] Claude error:', res.status); return null; }
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

/**
 * Enriquece um contato analisando suas conversas via IA.
 * Detecta: nome real, última compra, comportamento, interesses, ticket médio.
 */
async function enrichContact(pharmacyId, contactId, conversationId) {
  try {
    // Busca últimas 40 mensagens da conversa
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('direction, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(40);

    if (!messages || messages.length === 0) return;

    // Só mensagens com conteúdo real
    const validMessages = messages.filter((m) => m.content && m.content !== '[midia]');
    if (validMessages.length === 0) return;

    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('name, ai_summary, ai_behavior, phone')
      .eq('id', contactId)
      .single();

    const conversationText = validMessages
      .reverse()
      .map((m) => `[${m.direction === 'inbound' ? 'CLIENTE' : 'FARMÁCIA'}]: ${m.content}`)
      .join('\n');

    const system = `Você é um assistente de CRM para farmácias brasileiras. Analise conversas do WhatsApp e extraia informações sobre o cliente. Responda APENAS com JSON válido, sem markdown nem explicações.`;

    const user = `Analise esta conversa de WhatsApp entre uma farmácia e um cliente:

${conversationText}

Contexto atual do cliente:
- Nome salvo: ${contact?.name || 'desconhecido'}
- Telefone: ${contact?.phone}

Responda com este JSON exato:
{
  "name": "nome real do cliente se mencionado claramente na conversa, senão null",
  "ai_summary": "resumo em 1 frase do perfil deste cliente para o dono da farmácia",
  "ai_interests": ["produtos ou categorias de interesse mencionados"],
  "ai_last_purchase_product": "produto ou medicamento da última compra mencionada, ou null",
  "ai_behavior": "buyer|browser|support|inactive|unknown",
  "purchase_detected": true ou false,
  "purchase_date": "data ISO da compra se detectada, ou null",
  "total_spent": valor numérico estimado gasto em reais se mencionado, ou 0,
  "avg_ticket": ticket médio estimado em reais, ou 0
}

Definições:
- buyer: cliente que comprou ou demonstrou intenção clara de compra
- browser: pergunta sobre produtos/preços mas sem compra confirmada
- support: dúvidas sobre uso, dosagem ou problemas com pedido
- inactive: não interage há muito tempo ou despediu-se
- unknown: sem informação suficiente`;

    const text = await callClaude(system, user);
    if (!text) return;

    let extracted;
    try {
      extracted = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      console.error('[aiPipeline] JSON parse error:', text?.slice(0, 100));
      return;
    }

    // Monta update do contato
    const updates = {
      ai_summary: extracted.ai_summary || null,
      ai_interests: extracted.ai_interests || [],
      ai_last_purchase_product: extracted.ai_last_purchase_product || null,
      ai_behavior: extracted.ai_behavior || 'unknown',
      ai_enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Só atualiza nome se IA encontrou um nome real e o contato não tem nome
    if (extracted.name && !contact?.name) {
      updates.name = extracted.name;
    }

    // Atualiza dados financeiros se detectados
    if (extracted.total_spent > 0) updates.total_spent = extracted.total_spent;
    if (extracted.avg_ticket > 0) updates.avg_ticket = extracted.avg_ticket;

    // Se detectou compra, atualiza last_purchase_at
    if (extracted.purchase_detected && extracted.purchase_date) {
      try {
        const purchaseDate = new Date(extracted.purchase_date);
        if (!isNaN(purchaseDate.getTime())) {
          updates.last_purchase_at = purchaseDate.toISOString();
          // Incrementa total de compras
          await supabaseAdmin.rpc('increment_total_purchases', { contact_id: contactId }).catch(() => {});
        }
      } catch (_) {}
    } else if (extracted.purchase_detected) {
      // Compra detectada mas sem data — usa agora
      updates.last_purchase_at = new Date().toISOString();
    }

    await supabaseAdmin.from('contacts').update(updates).eq('id', contactId);

    // Gera evento se for compra nova
    if (extracted.purchase_detected) {
      await supabaseAdmin.from('pharmacy_events').insert({
        pharmacy_id: pharmacyId,
        type: 'client_recovered',
        title: `Compra detectada: ${contact?.name || contact?.phone}`,
        description: extracted.ai_last_purchase_product
          ? `Produto: ${extracted.ai_last_purchase_product}`
          : 'Compra identificada pela IA',
        contact_id: contactId,
        value_brl: extracted.total_spent || 0,
      }).catch(() => {});
    }

    console.log(`[aiPipeline] Contato ${contactId} enriquecido — behavior: ${extracted.ai_behavior}`);
  } catch (err) {
    console.error('[aiPipeline] enrichContact error:', err.message);
  }
}

/**
 * Roda em tempo real após cada mensagem recebida.
 * Só processa se a mensagem for do cliente (inbound).
 */
async function runRealtime(pharmacyId, contactId, conversationId) {
  // Debounce — espera 5s para acumular mensagens antes de processar
  setTimeout(async () => {
    try {
      await enrichContact(pharmacyId, contactId, conversationId);
    } catch (err) {
      console.error('[aiPipeline] runRealtime error:', err.message);
    }
  }, 5000);
}

/**
 * Batch diário — processa todas as conversas com atividade nas últimas 24h.
 * Roda às 3h da manhã.
 */
async function runDailyBatch() {
  if (!ANTHROPIC_API_KEY) { console.log('[aiPipeline] ANTHROPIC_API_KEY não configurada, batch pulado'); return; }

  console.log('[aiPipeline] Iniciando batch diário...');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select('id, pharmacy_id, contact_id')
    .gte('last_message_at', since)
    .eq('status', 'open');

  if (!conversations?.length) { console.log('[aiPipeline] Nenhuma conversa ativa'); return; }

  console.log(`[aiPipeline] Processando ${conversations.length} conversas...`);
  for (const conv of conversations) {
    await enrichContact(conv.pharmacy_id, conv.contact_id, conv.id);
    await new Promise((r) => setTimeout(r, 600)); // delay entre chamadas
  }
  console.log('[aiPipeline] Batch concluído');
}

function startDailyBatchJob() {
  function scheduleNext() {
    const now = new Date();
    const next = new Date();
    next.setHours(3, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    console.log(`[aiPipeline] Próximo batch em ${Math.round(delay / 3600000)}h`);
    setTimeout(async () => { await runDailyBatch(); scheduleNext(); }, delay);
  }
  scheduleNext();
}

module.exports = { enrichContact, runRealtime, runDailyBatch, startDailyBatchJob };

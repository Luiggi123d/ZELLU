// ============================================================
// Processa histórico de 30 dias quando cliente conecta o WhatsApp.
// Roda em background sem bloquear o usuário.
// ============================================================
const { supabaseAdmin } = require('../config/supabase');
const { enrichContact } = require('./aiPipeline');

const ONBOARDING_DAYS = 30;

/**
 * Analisa sentimento e reclamações de uma conversa via Claude Haiku.
 * Se ANTHROPIC_API_KEY não estiver definida, pula silenciosamente.
 */
async function analyzeConversationSentiment(pharmacyId, conversationId) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return;

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('direction, content, created_at')
    .eq('conversation_id', conversationId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!messages || messages.length === 0) return;

  const text = messages.map((m) => m.content).filter(Boolean).join('\n');
  if (!text.trim()) return;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: 'Analise o sentimento de mensagens de clientes de farmácia. Responda APENAS com JSON válido.',
      messages: [{
        role: 'user',
        content: `Analise estas mensagens de um cliente:

${text}

Responda com JSON:
{
  "sentiment": "positive|neutral|negative",
  "has_complaint": true|false,
  "complaint_summary": "resumo curto da reclamação em português ou null",
  "complaint_topics": ["lista", "de", "tópicos"]
}`,
      }],
    }),
  });

  if (!res.ok) {
    console.error(`[onboarding] Anthropic API error: ${res.status}`);
    return;
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text || '{}';

  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    console.error('[onboarding] Failed to parse sentiment JSON');
    return;
  }

  await supabaseAdmin
    .from('conversations')
    .update({
      sentiment: parsed.sentiment || 'neutral',
      has_complaint: !!parsed.has_complaint,
      complaint_summary: parsed.complaint_summary || null,
      complaint_topics: parsed.complaint_topics || [],
      sentiment_analyzed_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  // Se detectou reclamação, gera evento
  if (parsed.has_complaint) {
    await supabaseAdmin.from('pharmacy_events').insert({
      pharmacy_id: pharmacyId,
      type: 'complaint_detected',
      title: 'Reclamação detectada',
      description: parsed.complaint_summary || 'Cliente demonstrou insatisfação',
      conversation_id: conversationId,
    });
  }
}

/**
 * Processa histórico de 30 dias ao conectar WhatsApp.
 * Roda em background sem bloquear o usuário.
 */
async function processOnboardingHistory(pharmacyId) {
  console.log(`[onboarding] Iniciando processamento para farmácia ${pharmacyId}`);

  // Marca como processando
  await supabaseAdmin
    .from('pharmacies')
    .update({
      onboarding_status: 'processing',
      onboarding_started_at: new Date().toISOString(),
    })
    .eq('id', pharmacyId);

  try {
    const since = new Date(Date.now() - ONBOARDING_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Busca conversas dos últimos 30 dias
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select('id, contact_id')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', since);

    if (!conversations || conversations.length === 0) {
      await finishOnboarding(pharmacyId, 0);
      return;
    }

    // Limite máximo de conversas no onboarding inicial
    const conversationsToProcess = conversations.slice(0, 50);
    console.log(`[onboarding] Processando ${conversationsToProcess.length} de ${conversations.length} conversas`);
    let processed = 0;

    for (const conv of conversationsToProcess) {
      try {
        // Timeout de 30s por conversa para não travar
        await Promise.race([
          Promise.all([
            analyzeConversationSentiment(pharmacyId, conv.id),
            enrichContact(pharmacyId, conv.contact_id, conv.id),
          ]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 30000)
          ),
        ]);
        processed++;
      } catch (err) {
        console.error(`[onboarding] Conversa ${conv.id} falhou:`, err.message);
        // Continua para próxima conversa mesmo com erro
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Gera evento de onboarding completo
    await supabaseAdmin.from('pharmacy_events').insert({
      pharmacy_id: pharmacyId,
      type: 'onboarding_complete',
      title: 'Zellu analisou sua farmácia!',
      description: `${processed} conversas dos últimos 30 dias foram analisadas. Seu Pulse está pronto.`,
    });

    await finishOnboarding(pharmacyId, processed);
    console.log(`[onboarding] Concluído: ${processed}/${conversations.length} conversas`);
  } catch (err) {
    console.error('[onboarding] Erro geral:', err.message);
    await supabaseAdmin
      .from('pharmacies')
      .update({ onboarding_status: 'pending' })
      .eq('id', pharmacyId);
  }
}

async function finishOnboarding(pharmacyId, processed) {
  await supabaseAdmin
    .from('pharmacies')
    .update({
      onboarding_status: 'complete',
      onboarding_completed_at: new Date().toISOString(),
      history_days_processed: ONBOARDING_DAYS,
    })
    .eq('id', pharmacyId);
}

module.exports = { processOnboardingHistory, analyzeConversationSentiment };

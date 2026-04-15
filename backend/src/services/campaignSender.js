// ============================================================
// Serviço que processa a fila de envio de campanhas com delay
// anti-ban, variação de mensagem e limite diário por farmácia.
// ============================================================
const { supabaseAdmin } = require('../config/supabase');
const evolution = require('./evolutionApi');

// Delays em ms por modo de velocidade (min e max para randomizar)
const SPEED_CONFIG = {
  safe:   { min: 15000, max: 30000, dailyLimit: 50 },
  normal: { min: 8000,  max: 15000, dailyLimit: 80 },
  fast:   { min: 3000,  max: 8000,  dailyLimit: 150 },
};

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Variações de saudação para humanizar mensagens
const GREETING_VARIATIONS = [
  'Olá', 'Oi', 'Bom dia', 'Boa tarde', 'Ei', 'Olá tudo bem?',
];

/**
 * Varia levemente o texto da mensagem para evitar detecção de spam.
 * Substitui {nome} por first name e adiciona saudação se não houver.
 */
function varyMessage(template, contactName) {
  const greeting = GREETING_VARIATIONS[Math.floor(Math.random() * GREETING_VARIATIONS.length)];
  const firstName = contactName?.split(' ')[0] || 'cliente';
  const name = contactName ? `, ${firstName}` : '';

  // Substitui {nome} pelo nome real (ou "cliente" como fallback)
  let msg = template.replace(/\{nome\}/gi, firstName);

  // Se a mensagem não começa com saudação, adiciona uma aleatória
  const startsWithGreeting = /^(olá|oi|bom|boa|ei|hey|prezad)/i.test(msg.trim());
  if (!startsWithGreeting) {
    msg = `${greeting}${name}! ${msg}`;
  }

  return msg;
}

/**
 * Verifica e incrementa o contador diário de envios da farmácia.
 * Retorna false se o limite foi atingido.
 */
async function checkAndIncrementDailyLimit(pharmacyId, speedMode) {
  const limit = SPEED_CONFIG[speedMode]?.dailyLimit || 50;
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabaseAdmin
    .from('daily_send_counts')
    .select('count')
    .eq('pharmacy_id', pharmacyId)
    .eq('date', today)
    .maybeSingle();

  const current = data?.count || 0;
  if (current >= limit) return false;

  await supabaseAdmin
    .from('daily_send_counts')
    .upsert(
      { pharmacy_id: pharmacyId, date: today, count: current + 1 },
      { onConflict: 'pharmacy_id,date' }
    );

  return true;
}

/**
 * Processa o próximo item da fila — chamado a cada 10s pelo job.
 */
async function processCampaignQueue() {
  // Pega próximo item pendente cuja scheduled_at já passou
  const { data: items } = await supabaseAdmin
    .from('campaign_queue')
    .select('*, campaigns(id, speed_mode, vary_messages, name), contacts(name)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1);

  if (!items || items.length === 0) return;

  const item = items[0];
  const speedMode = item.campaigns?.speed_mode || 'safe';
  const varyMessagesFlag = item.campaigns?.vary_messages !== false;
  const contactName = item.contacts?.name;

  // Verifica limite diário — se estourou, reagenda pro dia seguinte 9h
  const canSend = await checkAndIncrementDailyLimit(item.pharmacy_id, speedMode);
  if (!canSend) {
    console.log(`[campaignSender] Limite diário atingido para farmácia ${item.pharmacy_id}`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await supabaseAdmin
      .from('campaign_queue')
      .update({ scheduled_at: tomorrow.toISOString() })
      .eq('id', item.id);
    return;
  }

  // Marca como enviando (lock otimista — se outro worker pegou antes, pula)
  const { data: locked, error: lockErr } = await supabaseAdmin
    .from('campaign_queue')
    .update({ status: 'sending' })
    .eq('id', item.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (lockErr || !locked) return;

  // Prepara mensagem (com variação se habilitado)
  const message = varyMessagesFlag
    ? varyMessage(item.message, contactName)
    : item.message;

  try {
    // Envia via Evolution API
    await evolution.sendTextMessage(item.pharmacy_id, item.phone, message);

    // Marca como enviado
    await supabaseAdmin
      .from('campaign_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', item.id);

    // Incrementa contador da campanha (atomic via RPC)
    await supabaseAdmin.rpc('increment_campaign_sent', { p_campaign_id: item.campaign_id });

    console.log(`[campaignSender] Enviado para ${item.phone} (campanha ${item.campaigns?.name})`);
  } catch (err) {
    console.error(`[campaignSender] Erro ao enviar para ${item.phone}:`, err.message);
    await supabaseAdmin
      .from('campaign_queue')
      .update({ status: 'failed', error_message: err.message })
      .eq('id', item.id);

    // Incrementa failed_count via RPC (atomic)
    await supabaseAdmin.rpc('increment_campaign_failed', { p_campaign_id: item.campaign_id });
  }

  // Finaliza a campanha se todos os itens já foram processados
  await supabaseAdmin.rpc('finalize_campaign_if_done', { p_campaign_id: item.campaign_id });

  // Log do próximo delay estimado (só informativo — o delay real está no scheduled_at)
  const config = SPEED_CONFIG[speedMode];
  const delay = randomDelay(config.min, config.max);
  console.log(`[campaignSender] Próximo envio em ~${Math.round(delay / 1000)}s`);
}

/**
 * Inicia o job que roda a cada 10 segundos.
 */
function startCampaignSenderJob() {
  console.log('[campaignSender] Job iniciado');
  setInterval(async () => {
    try {
      await processCampaignQueue();
    } catch (err) {
      console.error('[campaignSender] Erro no job:', err.message);
    }
  }, 10000);
}

module.exports = { startCampaignSenderJob, processCampaignQueue, varyMessage, SPEED_CONFIG };

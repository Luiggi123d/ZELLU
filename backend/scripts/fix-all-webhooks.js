require('dotenv').config();
const evolution = require('../src/services/evolutionApi');
const { supabaseAdmin } = require('../src/config/supabase');

async function main() {
  const { data: instances } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*')
    .eq('status', 'connected');

  console.log(`Encontradas ${instances?.length || 0} instâncias conectadas`);

  for (const inst of (instances || [])) {
    console.log(`\nInstância: ${inst.instance_name}`);
    try {
      const info = await evolution.getWebhookInfo(inst.pharmacy_id);
      console.log('  Webhook atual:', info.currentUrl);
      console.log('  Webhook esperado:', info.expectedUrl);
      console.log('  OK?', info.ok);

      if (!info.ok) {
        console.log('  -> Reconfigurando...');
        await evolution.setWebhook(inst.pharmacy_id);
        console.log('  -> Feito!');
      }
    } catch (err) {
      console.log('  ERRO:', err.message);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });

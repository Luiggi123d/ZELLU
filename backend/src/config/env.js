require('dotenv').config();

const env = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  zapiBaseUrl: process.env.ZAPI_BASE_URL,
  zapiClientToken: process.env.ZAPI_CLIENT_TOKEN,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Comma-separated list of allowed origins (in addition to frontendUrl)
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://zellu-orpin.vercel.app,http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

module.exports = env;

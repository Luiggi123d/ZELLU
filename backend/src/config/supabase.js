const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Admin client - bypasses RLS (use only in backend services)
const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

// Creates a client scoped to the authenticated user (respects RLS)
function createUserClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

module.exports = { supabaseAdmin, createUserClient };

const { supabaseAdmin } = require('../config/supabase');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.user = user;
  req.accessToken = token;
  next();
}

// Middleware to inject pharmacy_id from the user's profile
async function requirePharmacy(req, res, next) {
  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('pharmacy_id, role')
    .eq('id', req.user.id)
    .single();

  if (error || !profile) {
    return res.status(403).json({ error: 'Usuário sem farmácia associada' });
  }

  req.pharmacyId = profile.pharmacy_id;
  req.userRole = profile.role;
  next();
}

module.exports = { requireAuth, requirePharmacy };

const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { requireAuth } = require('../../middleware/auth');

const router = Router();

// POST /api/auth/signup - Register new pharmacy + owner
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, fullName, pharmacyName, pharmacyCnpj, pharmacyPhone } = req.body;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create pharmacy (tenant)
    const { data: pharmacy, error: pharmacyError } = await supabaseAdmin
      .from('pharmacies')
      .insert({
        name: pharmacyName,
        cnpj: pharmacyCnpj,
        phone: pharmacyPhone,
        owner_id: authData.user.id,
      })
      .select()
      .single();

    if (pharmacyError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: pharmacyError.message });
    }

    // Create user profile linked to pharmacy
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        pharmacy_id: pharmacy.id,
        role: 'owner',
      });

    if (profileError) {
      await supabaseAdmin.from('pharmacies').delete().eq('id', pharmacy.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({ user: authData.user, pharmacy });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*, pharmacies(*)')
      .eq('id', req.user.id)
      .single();

    if (error) return res.status(404).json({ error: 'Perfil não encontrado' });

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

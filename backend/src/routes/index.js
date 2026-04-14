const { Router } = require('express');
const authRoutes = require('./auth');
const whatsappRoutes = require('./whatsapp');

const router = Router();

router.use('/auth', authRoutes);
router.use('/whatsapp', whatsappRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;

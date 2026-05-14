const router = require('express').Router();
const service = require('../services/dashboard.service');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/stats', async (req, res, next) => {
  try { res.json({ success: true, data: await service.getStats() }); } catch (err) { next(err); }
});

module.exports = router;

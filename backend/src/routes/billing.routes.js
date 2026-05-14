const router = require('express').Router();
const ctrl = require('../controllers/billing.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/summary', ctrl.getRevenueSummary);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;

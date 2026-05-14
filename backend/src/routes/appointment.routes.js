const router = require('express').Router();
const ctrl = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/upcoming', ctrl.getUpcoming);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/cancel', ctrl.cancel);

module.exports = router;

const router = require('express').Router();
const ctrl = require('../controllers/doctor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/specializations', ctrl.getSpecializations);
router.post('/specializations', authorize('ADMIN'), ctrl.createSpecialization);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN'), ctrl.create);
router.put('/:id', authorize('ADMIN', 'DOCTOR'), ctrl.update);
router.put('/:id/schedule', authorize('ADMIN', 'DOCTOR'), ctrl.updateSchedule);

module.exports = router;

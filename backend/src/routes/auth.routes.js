const router = require('express').Router();
const { register, login, getProfile, getAllUsers } = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.get('/users', authenticate, authorize('ADMIN'), getAllUsers);

module.exports = router;

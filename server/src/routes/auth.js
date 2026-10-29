const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', auth.login);
router.get('/me', authenticate, auth.me);
router.put('/change-password', authenticate, auth.changePassword);
router.put('/admin-reset-password', authenticate, authorize('admin'), auth.adminResetPassword);

module.exports = router;

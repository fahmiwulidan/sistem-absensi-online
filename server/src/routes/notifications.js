const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/:id/read', ctrl.markAsRead);
router.put('/read-all', ctrl.markAllAsRead);

module.exports = router;

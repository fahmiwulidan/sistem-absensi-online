const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.post('/bulk', authorize('admin', 'guru'), ctrl.bulkCreate);
router.get('/', ctrl.getAll);
router.get('/recap', ctrl.recap);
router.get('/stats', ctrl.stats);
router.get('/check/:scheduleId/:date', ctrl.check);
router.put('/:id', authorize('admin', 'guru'), ctrl.update);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/admin', authorize('admin'), ctrl.admin);
router.get('/teacher', authorize('guru'), ctrl.teacher);
router.get('/student', authorize('siswa'), ctrl.student);
router.get('/parent', authorize('orangtua'), ctrl.parent);
router.get('/principal', authorize('kepsek'), ctrl.principal);

module.exports = router;

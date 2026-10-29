const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.get);
router.put('/', authorize('admin'), ctrl.update);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/academicYearController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/active', ctrl.getActive);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.delete);

module.exports = router;

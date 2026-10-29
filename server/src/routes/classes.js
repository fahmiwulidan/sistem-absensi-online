const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/students', ctrl.getStudents);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.delete);

module.exports = router;

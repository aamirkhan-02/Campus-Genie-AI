const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getSubjects, addSubject, deleteSubject } = require('../controllers/subjectController');

router.get('/', auth, getSubjects);
router.post('/', auth, addSubject);
router.delete('/:id', auth, deleteSubject);

module.exports = router;
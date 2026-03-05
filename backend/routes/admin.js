const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { getUsers, getUsageStats, getMostAskedQuestions, getMcqStats } = require('../controllers/adminController');


router.get('/users', auth, admin, getUsers);
router.get('/stats', auth, admin, getUsageStats);
router.get('/questions', auth, admin, getMostAskedQuestions);
router.get('/mcq-stats', auth, admin, getMcqStats);
module.exports = router;
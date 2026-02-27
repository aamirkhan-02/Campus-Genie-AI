const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStats, getWeakAreas, updateTimeSpent } = require('../controllers/dashboardController');

router.get('/stats', auth, getStats);
router.get('/weak-areas', auth, getWeakAreas);
router.post('/time', auth, updateTimeSpent);

module.exports = router;
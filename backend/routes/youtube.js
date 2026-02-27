const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  searchVideos, getRecommended, getTopicVideos,
  saveVideo, getSavedVideos, deleteSavedVideo,
  getLanguages
} = require('../controllers/youtubeController');

router.get('/languages', auth, getLanguages);
router.get('/search', auth, searchVideos);
router.get('/recommended/:subject', auth, getRecommended);
router.get('/topic', auth, getTopicVideos);
router.post('/save', auth, saveVideo);
router.get('/saved', auth, getSavedVideos);
router.delete('/saved/:id', auth, deleteSavedVideo);

module.exports = router;
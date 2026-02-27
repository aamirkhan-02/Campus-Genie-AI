const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateImage, generateVideo, textToSpeech, getMedia } = require('../controllers/mediaController');

router.post('/image', auth, generateImage);
router.post('/video', auth, generateVideo);
router.post('/tts', auth, textToSpeech);
router.get('/', auth, getMedia);

module.exports = router;
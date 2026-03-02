const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    generateImage, getStyles, saveImage,
    getSavedImages, deleteSavedImage
} = require('../controllers/imageGenerateController');

router.get('/generate', auth, generateImage);
router.get('/styles', auth, getStyles);
router.post('/save', auth, saveImage);
router.get('/saved', auth, getSavedImages);
router.delete('/saved/:id', auth, deleteSavedImage);

module.exports = router;

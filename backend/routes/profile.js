const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, deleteAccount, getActivity } = require('../controllers/profileController');

router.get('/', auth, getProfile);
router.put('/', auth, updateProfile);
router.delete('/', auth, deleteAccount);
router.get('/activity', auth, getActivity);

module.exports = router;
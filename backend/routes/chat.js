const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createSession, sendMessage, getSessionMessages,
  getSessions, deleteSession, exportChat
} = require('../controllers/chatController');

router.post('/sessions', auth, createSession);
router.post('/send', auth, sendMessage);
router.get('/sessions', auth, getSessions);
router.get('/sessions/:sessionId', auth, getSessionMessages);
router.delete('/sessions/:sessionId', auth, deleteSession);
router.get('/sessions/:sessionId/export', auth, exportChat);

module.exports = router;
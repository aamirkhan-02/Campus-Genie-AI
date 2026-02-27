const express = require('express');
const router = express.Router();
const mcqController = require('../controllers/mcqController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Subjects & Topics
router.get('/subjects', mcqController.getSubjectsWithTopics);
router.get('/topics/:subject', mcqController.getTopics);

// Quiz
router.post('/generate', mcqController.generateQuiz);
router.post('/answer', mcqController.submitAnswer);
router.post('/complete/:sessionId', mcqController.completeQuiz);

// History & Performance
router.get('/history', mcqController.getQuizHistory);
router.get('/performance', mcqController.getPerformance);

// Bookmarks
router.post('/bookmark', mcqController.bookmarkQuestion);
router.get('/bookmarks', mcqController.getBookmarks);

module.exports = router;

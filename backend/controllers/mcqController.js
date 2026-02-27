const pool = require('../config/db');
const gemini = require('../config/gemini');

// ============================================
// TOPIC LIST PER SUBJECT
// ============================================
const SUBJECT_TOPICS = {
    'DBMS': [
        'ER Model', 'Relational Model', 'Normalization (1NF, 2NF, 3NF, BCNF)',
        'SQL Queries', 'Joins', 'Transactions & ACID',
        'Concurrency Control', 'Indexing & Hashing', 'Deadlock',
        'Views & Triggers', 'Stored Procedures', 'NoSQL Basics'
    ],
    'C Programming': [
        'Variables & Data Types', 'Operators', 'Control Structures (if/else, switch)',
        'Loops (for, while, do-while)', 'Functions', 'Arrays',
        'Pointers', 'Strings', 'Structures & Unions',
        'File Handling', 'Dynamic Memory Allocation', 'Preprocessor Directives'
    ],
    'Java': [
        'OOP Concepts', 'Classes & Objects', 'Inheritance',
        'Polymorphism', 'Abstraction & Interfaces', 'Exception Handling',
        'Collections Framework', 'Multithreading', 'Generics',
        'File I/O', 'JDBC', 'Lambda Expressions & Streams'
    ],
    'Python': [
        'Variables & Data Types', 'Control Flow', 'Functions & Scope',
        'Lists, Tuples, Sets, Dicts', 'String Operations', 'File Handling',
        'OOP in Python', 'Exception Handling', 'List Comprehensions',
        'Decorators & Generators', 'Modules & Packages', 'Regular Expressions'
    ],
    'Data Structures': [
        'Arrays & Strings', 'Linked Lists', 'Stacks',
        'Queues', 'Trees (Binary, BST, AVL)', 'Heaps & Priority Queues',
        'Graphs', 'Hashing', 'Tries',
        'Segment Trees', 'Disjoint Set Union', 'Advanced Trees (B-Tree, Red-Black)'
    ],
    'Algorithms': [
        'Time & Space Complexity', 'Sorting Algorithms', 'Searching Algorithms',
        'Recursion & Backtracking', 'Divide and Conquer', 'Greedy Algorithms',
        'Dynamic Programming', 'Graph Algorithms (BFS, DFS)', 'Shortest Path Algorithms',
        'Minimum Spanning Tree', 'String Matching', 'NP-Completeness'
    ],
    'Operating Systems': [
        'Process Management', 'Threads', 'CPU Scheduling',
        'Process Synchronization', 'Deadlocks', 'Memory Management',
        'Virtual Memory & Paging', 'File Systems', 'Disk Scheduling',
        'I/O Systems', 'System Calls', 'Inter-Process Communication'
    ],
    'Computer Networks': [
        'OSI Model', 'TCP/IP Model', 'Data Link Layer & MAC',
        'IP Addressing & Subnetting', 'Routing Protocols', 'TCP vs UDP',
        'DNS', 'HTTP & HTTPS', 'Network Security & Firewalls',
        'Wireless Networks', 'Socket Programming', 'Congestion Control'
    ],
    'Aptitude': [
        'Number System', 'Percentages', 'Profit & Loss',
        'Ratio & Proportion', 'Time & Work', 'Time, Speed & Distance',
        'Probability', 'Permutations & Combinations', 'Averages',
        'Simple & Compound Interest', 'Algebra', 'Logical Reasoning'
    ],
    'System Design': [
        'Scalability Basics', 'Load Balancing', 'Caching Strategies',
        'Database Sharding', 'CAP Theorem', 'Microservices',
        'Message Queues', 'API Design (REST/GraphQL)', 'CDN',
        'Rate Limiting', 'Design Patterns', 'System Design Case Studies'
    ]
};

// ============================================
// GET TOPICS FOR A SUBJECT
// ============================================
exports.getTopics = async (req, res, next) => {
    try {
        const { subject } = req.params;

        const topics = SUBJECT_TOPICS[subject] || [];

        // Also get user's custom topics they've practiced
        const [customTopics] = await pool.query(
            `SELECT DISTINCT topic FROM mcq_sessions 
       WHERE user_id = ? AND subject_name = ? 
       AND topic NOT IN (?)
       ORDER BY topic`,
            [req.user.id, subject, topics.length > 0 ? topics : ['']]
        );

        const allTopics = [
            ...topics.map(t => ({ name: t, isDefault: true })),
            ...customTopics.map(t => ({ name: t.topic, isDefault: false }))
        ];

        res.json({
            success: true,
            data: {
                subject,
                topics: allTopics,
                totalTopics: allTopics.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET ALL SUBJECTS WITH TOPIC COUNTS
// ============================================
exports.getSubjectsWithTopics = async (req, res, next) => {
    try {
        const subjects = Object.entries(SUBJECT_TOPICS).map(([name, topics]) => ({
            name,
            topicCount: topics.length,
            topics: topics
        }));

        // Get user performance summary per subject
        const [performance] = await pool.query(
            `SELECT subject_name, 
              COUNT(*) as quizzes_taken,
              AVG(accuracy) as avg_accuracy,
              SUM(total_attempted) as total_questions
       FROM mcq_performance 
       WHERE user_id = ?
       GROUP BY subject_name`,
            [req.user.id]
        );

        const performanceMap = {};
        performance.forEach(p => {
            performanceMap[p.subject_name] = {
                quizzesTaken: p.quizzes_taken,
                avgAccuracy: parseFloat(p.avg_accuracy || 0).toFixed(1),
                totalQuestions: p.total_questions
            };
        });

        const result = subjects.map(s => ({
            ...s,
            performance: performanceMap[s.name] || { quizzesTaken: 0, avgAccuracy: 0, totalQuestions: 0 }
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GENERATE MCQ QUIZ
// ============================================
exports.generateQuiz = async (req, res, next) => {
    try {
        const { subject, topic, difficulty, numberOfQuestions } = req.body;

        // Validate inputs
        if (!subject || !topic || !difficulty || !numberOfQuestions) {
            return res.status(400).json({
                success: false,
                message: 'Subject, topic, difficulty, and numberOfQuestions are required'
            });
        }

        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: 'Difficulty must be easy, medium, or hard'
            });
        }

        const numQ = Math.min(Math.max(parseInt(numberOfQuestions), 1), 30);

        // Create quiz session
        const [session] = await pool.query(
            `INSERT INTO mcq_sessions (user_id, subject_name, topic, difficulty, total_questions) 
       VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, subject, topic, difficulty, numQ]
        );

        const sessionId = session.insertId;

        // Build the AI prompt based on difficulty
        const difficultyGuide = {
            easy: `EASY level questions. These should:
        - Test basic definitions and concepts
        - Have clearly distinguishable options
        - Focus on recall and recognition
        - Be suitable for beginners
        - Include straightforward, factual questions`,
            medium: `MEDIUM level questions. These should:
        - Test understanding and application
        - Have some tricky but fair distractors
        - Include scenario-based questions
        - Require analytical thinking
        - Mix conceptual and practical questions`,
            hard: `HARD level questions. These should:
        - Test deep understanding and critical thinking
        - Have very close and tricky options
        - Include code output prediction and edge cases
        - Require multi-step reasoning
        - Cover corner cases and advanced concepts
        - Include "which of the following is FALSE" style questions`
        };

        const prompt = `Generate exactly ${numQ} multiple choice questions (MCQs) on the topic "${topic}" in the subject "${subject}".

Difficulty: ${difficultyGuide[difficulty]}

STRICT RULES:
1. Each question must have exactly 4 options: A, B, C, D
2. Exactly ONE correct answer per question
3. All wrong options must be plausible (good distractors)
4. Include a brief explanation for the correct answer
5. Questions should be unique and not repetitive
6. Cover different aspects of the topic
7. For programming topics, include code snippets where relevant

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no extra text):
{
  "questions": [
    {
      "question": "What is the full question text here?",
      "options": {
        "A": "First option text",
        "B": "Second option text",
        "C": "Third option text",
        "D": "Fourth option text"
      },
      "correct": "A",
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Generate exactly ${numQ} questions. Return ONLY valid JSON.`;

        // Call Gemini
        const geminiResult = await gemini.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: 'You are an expert exam question setter for computer science students. Respond with valid JSON only, no markdown formatting.\n\n' + prompt }]
            }]
        });

        let aiResponse = geminiResult.response.text();

        // Clean the response - remove markdown code blocks if present
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse the questions
        let parsedQuestions;
        try {
            parsedQuestions = JSON.parse(aiResponse);
        } catch (parseError) {
            // Try to extract JSON from the response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedQuestions = JSON.parse(jsonMatch[0]);
            } else {
                // Delete the failed session
                await pool.query('DELETE FROM mcq_sessions WHERE id = ?', [sessionId]);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate questions. Please try again.'
                });
            }
        }

        const questions = parsedQuestions.questions || parsedQuestions;

        if (!Array.isArray(questions) || questions.length === 0) {
            await pool.query('DELETE FROM mcq_sessions WHERE id = ?', [sessionId]);
            return res.status(500).json({
                success: false,
                message: 'No questions generated. Please try again.'
            });
        }

        // Save questions to database
        const questionValues = questions.map((q, index) => [
            sessionId,
            index + 1,
            q.question,
            q.options?.A || q.option_a || '',
            q.options?.B || q.option_b || '',
            q.options?.C || q.option_c || '',
            q.options?.D || q.option_d || '',
            q.correct || q.correct_answer || 'A',
            q.explanation || '',
            difficulty
        ]);

        await pool.query(
            `INSERT INTO mcq_questions 
       (session_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty) 
       VALUES ?`,
            [questionValues]
        );

        // Update session with actual question count
        await pool.query(
            'UPDATE mcq_sessions SET total_questions = ? WHERE id = ?',
            [questions.length, sessionId]
        );

        // Return questions WITHOUT correct answers (for the quiz)
        const quizQuestions = questions.map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: {
                A: q.options?.A || q.option_a,
                B: q.options?.B || q.option_b,
                C: q.options?.C || q.option_c,
                D: q.options?.D || q.option_d
            }
        }));

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                subject,
                topic,
                difficulty,
                totalQuestions: questions.length,
                questions: quizQuestions
            }
        });
    } catch (error) {
        if (error.code === 'insufficient_quota') {
            return res.status(429).json({
                success: false,
                message: 'AI quota exceeded. Please try again later.'
            });
        }
        next(error);
    }
};

// ============================================
// SUBMIT ANSWER FOR A QUESTION
// ============================================
exports.submitAnswer = async (req, res, next) => {
    try {
        const { sessionId, questionNumber, answer, timeSpent } = req.body;

        if (!sessionId || !questionNumber || !answer) {
            return res.status(400).json({
                success: false,
                message: 'sessionId, questionNumber, and answer are required'
            });
        }

        // Verify session belongs to user
        const [session] = await pool.query(
            'SELECT * FROM mcq_sessions WHERE id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (session.length === 0) {
            return res.status(404).json({ success: false, message: 'Quiz session not found' });
        }

        // Get the question
        const [question] = await pool.query(
            'SELECT * FROM mcq_questions WHERE session_id = ? AND question_number = ?',
            [sessionId, questionNumber]
        );

        if (question.length === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const q = question[0];
        const isCorrect = answer.toUpperCase() === q.correct_answer;

        // Update question with user's answer
        await pool.query(
            `UPDATE mcq_questions 
       SET user_answer = ?, is_correct = ?, time_spent_seconds = ?, answered_at = NOW() 
       WHERE session_id = ? AND question_number = ?`,
            [answer.toUpperCase(), isCorrect, timeSpent || 0, sessionId, questionNumber]
        );

        // Update session counts
        await pool.query(
            `UPDATE mcq_sessions 
       SET answered = answered + 1,
           correct = correct + ?,
           wrong = wrong + ?,
           time_taken_seconds = time_taken_seconds + ?
       WHERE id = ?`,
            [isCorrect ? 1 : 0, isCorrect ? 0 : 1, timeSpent || 0, sessionId]
        );

        res.json({
            success: true,
            data: {
                isCorrect,
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                yourAnswer: answer.toUpperCase()
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// COMPLETE QUIZ AND GET RESULTS
// ============================================
exports.completeQuiz = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        // Get session
        const [session] = await pool.query(
            'SELECT * FROM mcq_sessions WHERE id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (session.length === 0) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const quiz = session[0];

        // Get all questions with answers
        const [questions] = await pool.query(
            'SELECT * FROM mcq_questions WHERE session_id = ? ORDER BY question_number',
            [sessionId]
        );

        // Calculate stats
        const answered = questions.filter(q => q.user_answer !== null).length;
        const correct = questions.filter(q => q.is_correct === 1).length;
        const wrong = questions.filter(q => q.is_correct === 0 && q.user_answer !== null).length;
        const skipped = questions.filter(q => q.user_answer === null).length;
        const scorePercentage = answered > 0 ? ((correct / quiz.total_questions) * 100) : 0;
        const totalTime = questions.reduce((sum, q) => sum + (q.time_spent_seconds || 0), 0);

        // Update session
        await pool.query(
            `UPDATE mcq_sessions 
       SET status = 'completed', 
           answered = ?, correct = ?, wrong = ?, skipped = ?,
           score_percentage = ?,
           time_taken_seconds = ?,
           completed_at = NOW() 
       WHERE id = ?`,
            [answered, correct, wrong, skipped, scorePercentage.toFixed(2), totalTime, sessionId]
        );

        // Update performance tracking
        await pool.query(
            `INSERT INTO mcq_performance 
       (user_id, subject_name, topic, difficulty, total_attempted, total_correct, accuracy, best_score, total_time_seconds, last_attempted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         total_attempted = total_attempted + VALUES(total_attempted),
         total_correct = total_correct + VALUES(total_correct),
         accuracy = (total_correct + VALUES(total_correct)) / (total_attempted + VALUES(total_attempted)) * 100,
         best_score = GREATEST(best_score, VALUES(best_score)),
         total_time_seconds = total_time_seconds + VALUES(total_time_seconds),
         last_attempted_at = NOW()`,
            [req.user.id, quiz.subject_name, quiz.topic, quiz.difficulty,
                answered, correct, scorePercentage.toFixed(2), scorePercentage.toFixed(2), totalTime]
        );

        // Update study stats
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
            `INSERT INTO study_stats (user_id, subject_name, questions_asked, session_date) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE questions_asked = questions_asked + ?`,
            [req.user.id, quiz.subject_name, answered, today, answered]
        );

        // Format results
        const results = {
            sessionId: parseInt(sessionId),
            subject: quiz.subject_name,
            topic: quiz.topic,
            difficulty: quiz.difficulty,
            totalQuestions: quiz.total_questions,
            answered,
            correct,
            wrong,
            skipped,
            scorePercentage: parseFloat(scorePercentage.toFixed(2)),
            timeTaken: totalTime,
            grade: getGrade(scorePercentage),
            questions: questions.map(q => ({
                number: q.question_number,
                question: q.question_text,
                options: {
                    A: q.option_a,
                    B: q.option_b,
                    C: q.option_c,
                    D: q.option_d
                },
                correctAnswer: q.correct_answer,
                yourAnswer: q.user_answer,
                isCorrect: q.is_correct === 1,
                explanation: q.explanation,
                timeSpent: q.time_spent_seconds,
                isBookmarked: q.is_bookmarked === 1
            }))
        };

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET QUIZ HISTORY
// ============================================
exports.getQuizHistory = async (req, res, next) => {
    try {
        const { subject, difficulty, limit } = req.query;

        let query = `SELECT * FROM mcq_sessions WHERE user_id = ?`;
        const params = [req.user.id];

        if (subject) {
            query += ' AND subject_name = ?';
            params.push(subject);
        }
        if (difficulty) {
            query += ' AND difficulty = ?';
            params.push(difficulty);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit) || 50);

        const [sessions] = await pool.query(query, params);

        res.json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET PERFORMANCE ANALYTICS
// ============================================
exports.getPerformance = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Overall stats
        const [overall] = await pool.query(
            `SELECT 
         COUNT(*) as total_quizzes,
         SUM(total_questions) as total_questions,
         SUM(correct) as total_correct,
         AVG(score_percentage) as avg_score,
         MAX(score_percentage) as best_score,
         SUM(time_taken_seconds) as total_time
       FROM mcq_sessions 
       WHERE user_id = ? AND status = 'completed'`,
            [userId]
        );

        // Per subject performance
        const [subjectPerf] = await pool.query(
            `SELECT 
         subject_name,
         COUNT(*) as quizzes,
         AVG(score_percentage) as avg_score,
         MAX(score_percentage) as best_score,
         SUM(correct) as total_correct,
         SUM(total_questions) as total_questions
       FROM mcq_sessions 
       WHERE user_id = ? AND status = 'completed'
       GROUP BY subject_name 
       ORDER BY avg_score DESC`,
            [userId]
        );

        // Per difficulty performance
        const [diffPerf] = await pool.query(
            `SELECT 
         difficulty,
         COUNT(*) as quizzes,
         AVG(score_percentage) as avg_score,
         SUM(correct) as total_correct,
         SUM(total_questions) as total_questions
       FROM mcq_sessions 
       WHERE user_id = ? AND status = 'completed'
       GROUP BY difficulty`,
            [userId]
        );

        // Weak topics (low accuracy)
        const [weakTopics] = await pool.query(
            `SELECT subject_name, topic, difficulty, accuracy, total_attempted
       FROM mcq_performance 
       WHERE user_id = ? AND total_attempted >= 3
       ORDER BY accuracy ASC LIMIT 10`,
            [userId]
        );

        // Strong topics (high accuracy)
        const [strongTopics] = await pool.query(
            `SELECT subject_name, topic, difficulty, accuracy, total_attempted
       FROM mcq_performance 
       WHERE user_id = ? AND total_attempted >= 3
       ORDER BY accuracy DESC LIMIT 10`,
            [userId]
        );

        // Recent quiz trend (last 10 quizzes)
        const [trend] = await pool.query(
            `SELECT score_percentage, subject_name, difficulty, completed_at
       FROM mcq_sessions 
       WHERE user_id = ? AND status = 'completed'
       ORDER BY completed_at DESC LIMIT 10`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                overall: overall[0],
                subjectPerformance: subjectPerf,
                difficultyPerformance: diffPerf,
                weakTopics,
                strongTopics,
                recentTrend: trend.reverse()
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// BOOKMARK A QUESTION
// ============================================
exports.bookmarkQuestion = async (req, res, next) => {
    try {
        const { sessionId, questionNumber } = req.body;

        // Get the question
        const [question] = await pool.query(
            `SELECT mq.*, ms.subject_name, ms.topic 
       FROM mcq_questions mq
       JOIN mcq_sessions ms ON mq.session_id = ms.id
       WHERE mq.session_id = ? AND mq.question_number = ? AND ms.user_id = ?`,
            [sessionId, questionNumber, req.user.id]
        );

        if (question.length === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const q = question[0];

        // Toggle bookmark on original question
        await pool.query(
            'UPDATE mcq_questions SET is_bookmarked = NOT is_bookmarked WHERE session_id = ? AND question_number = ?',
            [sessionId, questionNumber]
        );

        // Add or remove from bookmarks table
        const [existing] = await pool.query(
            'SELECT id FROM mcq_bookmarks WHERE user_id = ? AND question_text = ?',
            [req.user.id, q.question_text]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM mcq_bookmarks WHERE id = ?', [existing[0].id]);
            res.json({ success: true, message: 'Bookmark removed', bookmarked: false });
        } else {
            await pool.query(
                `INSERT INTO mcq_bookmarks 
         (user_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject_name, topic, difficulty) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                q.correct_answer, q.explanation, q.subject_name, q.topic, q.difficulty]
            );
            res.json({ success: true, message: 'Question bookmarked', bookmarked: true });
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET BOOKMARKED QUESTIONS
// ============================================
exports.getBookmarks = async (req, res, next) => {
    try {
        const { subject } = req.query;

        let query = 'SELECT * FROM mcq_bookmarks WHERE user_id = ?';
        const params = [req.user.id];

        if (subject) {
            query += ' AND subject_name = ?';
            params.push(subject);
        }

        query += ' ORDER BY created_at DESC';

        const [bookmarks] = await pool.query(query, params);

        res.json({ success: true, data: bookmarks });
    } catch (error) {
        next(error);
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function getGrade(percentage) {
    if (percentage >= 90) return { grade: 'A+', emoji: '🏆', label: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', emoji: '🌟', label: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B+', emoji: '👏', label: 'Very Good!' };
    if (percentage >= 60) return { grade: 'B', emoji: '👍', label: 'Good Job!' };
    if (percentage >= 50) return { grade: 'C', emoji: '📚', label: 'Keep Studying!' };
    if (percentage >= 40) return { grade: 'D', emoji: '💪', label: 'Needs Improvement' };
    return { grade: 'F', emoji: '📖', label: 'Study More & Try Again' };
}
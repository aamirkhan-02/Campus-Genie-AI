import { useState, useEffect, useRef } from 'react';
import { mcqService } from '../../services/mcqService';
import { 
  ChevronLeft, ChevronRight, Flag, Clock, Bookmark,
  AlertCircle, CheckCircle, XCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function McqQuiz({ quizData, onComplete, onQuit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState({});
  const [timer, setTimer] = useState(0);
  const [questionTimers, setQuestionTimers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState({});
  const timerRef = useRef(null);
  const questionStartRef = useRef(Date.now());

  const { questions, sessionId, subject, topic, difficulty, totalQuestions } = quizData;
  const currentQuestion = questions[currentIndex];

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Track time per question
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIndex]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = async (option) => {
    if (answers[currentIndex] !== undefined) return; // Already answered

    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);

    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    setQuestionTimers(prev => ({ ...prev, [currentIndex]: timeSpent }));

    // Submit to backend
    try {
      const result = await mcqService.submitAnswer({
        sessionId,
        questionNumber: currentQuestion.id,
        answer: option,
        timeSpent
      });

      setShowResult(prev => ({
        ...prev,
        [currentIndex]: {
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation
        }
      }));
    } catch {
      toast.error('Failed to submit answer');
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await mcqService.bookmarkQuestion(sessionId, currentQuestion.id);
      setBookmarked(prev => ({
        ...prev,
        [currentIndex]: res.bookmarked
      }));
      toast.success(res.message);
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      clearInterval(timerRef.current);
      const results = await mcqService.completeQuiz(sessionId);
      onComplete(results);
    } catch {
      toast.error('Failed to complete quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuit = () => {
    if (window.confirm('Are you sure you want to quit? Your progress will be lost.')) {
      clearInterval(timerRef.current);
      onQuit();
    }
  };

  const answeredCount = Object.keys(answers).length;
  const result = showResult[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const progress = (answeredCount / totalQuestions) * 100;

  const getOptionStyle = (option) => {
    if (!result) {
      // Not yet answered
      if (selectedAnswer === option) {
        return 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
      }
      return 'border-gray-200 dark:border-dark-400 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-dark-500 cursor-pointer';
    }

    // Answered - show result
    if (option === result.correctAnswer) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
    if (option === selectedAnswer && !result.isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }
    return 'border-gray-200 dark:border-dark-400 opacity-60';
  };

  const getOptionIcon = (option) => {
    if (!result) return null;
    if (option === result.correctAnswer) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (option === selectedAnswer && !result.isCorrect) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium px-3 py-1 bg-primary-100 dark:bg-primary-900/30 
                           text-primary-600 rounded-full">
              {subject}
            </span>
            <span className="text-sm text-gray-500">{topic}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
              ${difficulty === 'easy' ? 'bg-green-100 text-green-700' : 
                difficulty === 'medium' ? 'bg-orange-100 text-orange-700' : 
                'bg-red-100 text-red-700'}`}>
              {difficulty}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-medium">{formatTime(timer)}</span>
            </div>
            <button onClick={handleQuit} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-500 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {answeredCount}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="card p-6">
        {/* Question Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 
                           rounded-lg flex items-center justify-center font-bold text-sm">
              {currentIndex + 1}
            </span>
            <span className="text-sm text-gray-500">of {totalQuestions}</span>
          </div>
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-lg transition-all ${
              bookmarked[currentIndex] 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-500 text-gray-400'
            }`}
          >
            <Bookmark className="w-5 h-5" fill={bookmarked[currentIndex] ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Question Text */}
        <h3 className="text-lg font-semibold mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {['A', 'B', 'C', 'D'].map(option => (
            <button
              key={option}
              onClick={() => handleSelectAnswer(option)}
              disabled={!!result}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 
                         text-left transition-all ${getOptionStyle(option)}`}
            >
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center 
                             font-bold text-sm flex-shrink-0
                ${selectedAnswer === option && result?.isCorrect && option === result.correctAnswer
                  ? 'bg-green-500 text-white'
                  : selectedAnswer === option && !result?.isCorrect && option === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : option === result?.correctAnswer
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-500'
                }`}>
                {option}
              </span>
              <span className="flex-1">{currentQuestion.options[option]}</span>
              {getOptionIcon(option)}
            </button>
          ))}
        </div>

        {/* Explanation (after answering) */}
        {result && (
          <div className={`p-4 rounded-xl animate-fade-in ${
            result.isCorrect 
              ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-semibold">
                {result.isCorrect ? 'Correct! 🎉' : 'Incorrect'}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {result.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="btn-ghost flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Question dots */}
          <div className="hidden sm:flex items-center gap-1 flex-wrap justify-center max-w-sm">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all
                  ${i === currentIndex
                    ? 'bg-primary-600 text-white scale-110'
                    : answers[i] !== undefined
                      ? showResult[i]?.isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Flag className="w-5 h-5" />
                  Finish Quiz
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1))}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
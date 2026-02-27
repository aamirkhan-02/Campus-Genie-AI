import { Trophy, RotateCcw, CheckCircle, XCircle, MinusCircle, Clock, Target } from 'lucide-react';
import { formatTime } from '../../utils/helpers';

export default function McqResults({ results, onRetry }) {
  const {
    subject, topic, difficulty, totalQuestions,
    correct, wrong, skipped, scorePercentage,
    timeTaken, grade, questions
  } = results;

  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-500';
    if (scorePercentage >= 60) return 'text-yellow-500';
    if (scorePercentage >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCircleColor = () => {
    if (scorePercentage >= 80) return '#22c55e';
    if (scorePercentage >= 60) return '#eab308';
    if (scorePercentage >= 40) return '#f97316';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (scorePercentage / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score Card */}
      <div className="card p-8 text-center">
        <div className="text-5xl mb-3">{grade.emoji}</div>
        <h2 className="text-3xl font-bold mb-1">{grade.label}</h2>
        <p className="text-gray-500 dark:text-dark-200 mb-6">
          {subject} — {topic} ({difficulty})
        </p>

        {/* Circular Progress */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle cx="80" cy="80" r="60" stroke="currentColor" 
                    className="text-gray-200 dark:text-dark-500" strokeWidth="8" fill="none" />
            <circle cx="80" cy="80" r="60" stroke={getCircleColor()} strokeWidth="8" fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute">
            <span className={`text-4xl font-bold ${getScoreColor()}`}>
              {scorePercentage}%
            </span>
            <p className="text-xs text-gray-500">Grade: {grade.grade}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-2xl mx-auto">
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-3">
            <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalQuestions}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{wrong}</p>
            <p className="text-xs text-gray-500">Wrong</p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-3">
            <MinusCircle className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{skipped}</p>
            <p className="text-xs text-gray-500">Skipped</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{formatTime(timeTaken)}</p>
            <p className="text-xs text-gray-500">Time</p>
          </div>
        </div>

        <button onClick={onRetry} className="btn-primary mt-6 inline-flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Take Another Quiz
        </button>
      </div>

      {/* Question Review */}
      <div className="card p-6">
        <h3 className="text-lg font-bold mb-4">📋 Question Review</h3>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                q.isCorrect
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                  : q.yourAnswer
                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-dark-400'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center 
                               text-white text-xs font-bold flex-shrink-0
                  ${q.isCorrect ? 'bg-green-500' : q.yourAnswer ? 'bg-red-500' : 'bg-gray-400'}`}>
                  {q.number}
                </span>
                <p className="font-medium text-sm">{q.question}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10 mb-3">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div
                    key={opt}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      ${opt === q.correctAnswer
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium'
                        : opt === q.yourAnswer && !q.isCorrect
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 line-through'
                          : 'bg-gray-50 dark:bg-dark-500'
                      }`}
                  >
                    <span className="font-bold">{opt}.</span>
                    <span>{q.options[opt]}</span>
                    {opt === q.correctAnswer && <CheckCircle className="w-3.5 h-3.5 ml-auto text-green-500" />}
                    {opt === q.yourAnswer && !q.isCorrect && <XCircle className="w-3.5 h-3.5 ml-auto text-red-500" />}
                  </div>
                ))}
              </div>

              {q.explanation && (
                <div className="ml-10 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm">
                  <span className="font-semibold text-blue-600">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
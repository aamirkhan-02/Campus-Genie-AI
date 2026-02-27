import { useState, useEffect } from 'react';
import { mcqService } from '../../services/mcqService';
import { Bookmark, CheckCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function McqBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState({});

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await mcqService.getBookmarks();
      setBookmarks(data);
    } catch {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (id) => {
    setShowAnswer(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" className="mx-auto" /></div>;

  if (bookmarks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Bookmarks Yet</h3>
        <p className="text-sm text-gray-500">Bookmark questions during quizzes to review them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{bookmarks.length} bookmarked questions</p>

      {bookmarks.map(q => (
        <div key={q.id} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-500 rounded-full">{q.subject_name}</span>
              <span>{q.topic}</span>
              <span className="capitalize">{q.difficulty}</span>
            </div>
            <Bookmark className="w-4 h-4 text-yellow-500" fill="currentColor" />
          </div>

          <p className="font-medium mb-4">{q.question_text}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {['A', 'B', 'C', 'D'].map(opt => {
              const optionKey = `option_${opt.toLowerCase()}`;
              return (
                <div
                  key={opt}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    ${showAnswer[q.id] && opt === q.correct_answer
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 font-medium'
                      : 'bg-gray-50 dark:bg-dark-500'
                    }`}
                >
                  <span className="font-bold">{opt}.</span>
                  <span>{q[optionKey]}</span>
                  {showAnswer[q.id] && opt === q.correct_answer && (
                    <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => toggleAnswer(q.id)}
            className="text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            {showAnswer[q.id] ? 'Hide Answer' : 'Show Answer'}
          </button>

          {showAnswer[q.id] && q.explanation && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm animate-fade-in">
              <span className="font-semibold text-blue-600">Explanation: </span>
              {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
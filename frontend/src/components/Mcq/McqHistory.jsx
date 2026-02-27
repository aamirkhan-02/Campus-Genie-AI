import { useState, useEffect } from 'react';
import { mcqService } from '../../services/mcqService';
import { formatRelativeTime } from '../../utils/helpers';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function McqHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await mcqService.getHistory();
      setHistory(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" className="mx-auto" /></div>;

  const subjects = ['all', ...new Set(history.map(h => h.subject_name))];
  
  const filtered = history.filter(h => {
    if (filterSubject !== 'all' && h.subject_name !== filterSubject) return false;
    if (filterDifficulty !== 'all' && h.difficulty !== filterDifficulty) return false;
    return true;
  });

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    if (score >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                className="input-field w-auto">
          {subjects.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>
          ))}
        </select>
        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
                className="input-field w-auto">
          <option value="all">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No quiz history found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(quiz => (
            <div key={quiz.id} className="card p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center
                                 ${getScoreBadge(quiz.score_percentage)}`}>
                    <span className="text-lg font-bold">{parseFloat(quiz.score_percentage).toFixed(0)}%</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{quiz.topic}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-500 rounded-full">
                        {quiz.subject_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full capitalize
                        ${quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          quiz.difficulty === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'}`}>
                        {quiz.difficulty}
                      </span>
                      <span>{formatRelativeTime(quiz.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {quiz.correct}
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <XCircle className="w-4 h-4" />
                    {quiz.wrong}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    {Math.floor(quiz.time_taken_seconds / 60)}m
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    quiz.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {quiz.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
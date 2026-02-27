import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { formatRelativeTime, truncate } from '../utils/helpers';
import { MessageSquare, Trash2, ArrowRight, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await chatService.getSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    try {
      await chatService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const subjects = ['all', ...new Set(sessions.map(s => s.subject_name))];

  const filtered = sessions.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
                       s.subject_name.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'all' || s.subject_name === filterSubject;
    return matchSearch && matchSubject;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Chat History</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="input-field pl-12"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          {subjects.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>
          ))}
        </select>
      </div>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chats found</h3>
          <p className="text-gray-500 text-sm">Start a new conversation to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(session => (
            <div
              key={session.id}
              className="card p-4 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/chat/${session.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl 
                              flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{session.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-dark-200">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-500 rounded-full">
                      {session.subject_name}
                    </span>
                    <span>{session.mode}</span>
                    <span>{session.message_count} messages</span>
                    <span>{formatRelativeTime(session.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 
                             rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { formatRelativeTime, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ChatHistory({ onSelectSession, currentSessionId, refreshKey }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [refreshKey]);

  const loadSessions = async () => {
    try {
      const data = await chatService.getSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-1">
      <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-dark-200 uppercase tracking-wider">
        Recent Chats
      </h3>
      {sessions.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-400">No chat history yet</p>
      ) : (
        sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm
              transition-all group
              ${currentSessionId === session.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-50 dark:hover:bg-dark-500'
              }
            `}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{truncate(session.title, 30)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {session.subject_name} · {formatRelativeTime(session.created_at)}
              </p>
            </div>
            <button
              onClick={(e) => deleteSession(session.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </button>
        ))
      )}
    </div>
  );
}
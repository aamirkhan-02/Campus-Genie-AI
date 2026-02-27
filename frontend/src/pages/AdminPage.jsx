import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { Users, MessageSquare, Activity, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, questionsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/questions')
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setQuestions(questionsRes.data.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Sessions', value: stats?.total_sessions, icon: MessageSquare, color: 'from-green-500 to-green-600' },
          { label: 'Total Messages', value: stats?.total_messages, icon: Activity, color: 'from-purple-500 to-purple-600' },
          { label: 'Active Today', value: stats?.daily_active_users, icon: BarChart3, color: 'from-orange-500 to-orange-600' }
        ].map((card, i) => (
          <div key={i} className="card p-6">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl 
                          flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold">{card.value || 0}</h3>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'users', 'questions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all
              ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Subjects */}
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">Top Subjects</h3>
            <div className="space-y-3">
              {stats?.top_subjects?.map((subject, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{subject.subject_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-100 dark:bg-dark-500 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${Math.min((subject.total_questions / (stats.top_subjects[0]?.total_questions || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{subject.total_questions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats?.recent_activity?.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-500 rounded-xl text-sm">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full 
                                flex items-center justify-center text-primary-600 font-bold text-xs">
                    {activity.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.username} · {activity.subject_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-500">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold">User</th>
                  <th className="text-left px-6 py-4 font-semibold">Email</th>
                  <th className="text-left px-6 py-4 font-semibold">Role</th>
                  <th className="text-left px-6 py-4 font-semibold">Sessions</th>
                  <th className="text-left px-6 py-4 font-semibold">Questions</th>
                  <th className="text-left px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-400">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-500">
                    <td className="px-6 py-4 font-medium">{u.username}</td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{u.total_sessions}</td>
                    <td className="px-6 py-4">{u.total_questions}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Most Recent Questions</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-dark-500 rounded-xl">
                <p className="text-sm font-medium mb-2">{q.content}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>By {q.username}</span>
                  <span>·</span>
                  <span>{q.subject_name}</span>
                  <span>·</span>
                  <span>{q.mode}</span>
                  <span>·</span>
                  <span>{new Date(q.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
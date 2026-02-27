import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import StatsCards from '../components/Dashboard/StatsCards';
import StudyChart from '../components/Dashboard/StudyChart';
import WeakAreas from '../components/Dashboard/WeakAreas';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { SUBJECTS } from '../utils/constants';
import { MessageSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [weakAreas, setWeakAreas] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, weakData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getWeakAreas()
      ]);
      setStats(statsData);
      setWeakAreas(weakData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-purple-600 text-white border-0">
        <h2 className="text-2xl font-bold mb-1">
          Welcome back, {user?.username}! 👋
        </h2>
        <p className="text-primary-100">Ready to learn something new today?</p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Chart */}
      <StudyChart data={stats?.weekly_activity} />

      {/* Quick Start Subjects */}
      <div className="card p-6">
        <h3 className="text-lg font-bold mb-4">Quick Start</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SUBJECTS.slice(0, 10).map(subject => (
            <button
              key={subject.name}
              onClick={() => navigate(`/chat?subject=${encodeURIComponent(subject.name)}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl 
                       bg-gray-50 dark:bg-dark-500 hover:bg-primary-50 dark:hover:bg-primary-900/20
                       hover:text-primary-600 transition-all group"
            >
              <span className="text-2xl">{subject.icon}</span>
              <span className="text-xs font-medium text-center">{subject.name}</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Weak Areas & Suggestions */}
      <WeakAreas data={weakAreas} />

      {/* Recent Sessions */}
      {stats?.recent_sessions?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {stats.recent_sessions.map(session => (
              <button
                key={session.id}
                onClick={() => navigate(`/chat/${session.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-xl 
                         hover:bg-gray-50 dark:hover:bg-dark-500 transition-all text-left"
              >
                <MessageSquare className="w-5 h-5 text-primary-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{session.title}</p>
                  <p className="text-sm text-gray-500">{session.subject_name} · {session.mode}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
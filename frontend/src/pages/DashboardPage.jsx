import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { authService } from '../services/authService';
import StatsCards from '../components/Dashboard/StatsCards';
import StudyChart from '../components/Dashboard/StudyChart';
import WeakAreas from '../components/Dashboard/WeakAreas';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import CropModal from '../components/Common/CropModal';
import { useAuth } from '../hooks/useAuth';
import { SUBJECTS } from '../utils/constants';
import { MessageSquare, ArrowRight, Camera, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [weakAreas, setWeakAreas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropDone = async (blob) => {
    setCropImage(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const res = await authService.uploadAvatar(formData);
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Profile picture updated! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await authService.removeAvatar();
      updateUser({ avatar: null });
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove avatar');
    }
  };

  // Use proxy path directly
  const avatarUrl = user?.avatar || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Profile Welcome Card */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-purple-600 text-white border-0">
        <div className="flex items-center gap-5">
          {/* Profile Avatar */}
          <div className="relative group flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative block"
              title="Change profile picture"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.username}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center
                              text-white font-bold text-2xl ring-4 ring-white/30 shadow-lg">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            {user?.avatar && (
              <button
                onClick={handleAvatarRemove}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 
                         rounded-full flex items-center justify-center shadow-lg 
                         opacity-0 group-hover:opacity-100 transition-all"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div>
            <h2 className="text-2xl font-bold mb-1">
              Welcome back, {user?.username}! 👋
            </h2>
            <p className="text-primary-100">{user?.email}</p>
            <p className="text-primary-200 text-sm mt-1">Ready to learn something new today?</p>
          </div>
        </div>
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

      {/* Crop Modal */}
      {cropImage && (
        <CropModal
          imageSrc={cropImage}
          onCropDone={handleCropDone}
          onClose={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  User, Mail, Shield, Calendar, Clock, Award,
  Save, Loader, Key, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTime, formatDate } from '../utils/helpers';

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  // Profile form
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data.data);
      setUsername(res.data.data.username);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) { toast.error('Username required'); return; }
    setSaving(true);
    try {
      await api.put('/profile', { username });
      toast.success('Profile updated');
      checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Enter your password to confirm account deletion:');
    if (!password) return;

    try {
      await api.delete('/profile', { data: { password } });
      toast.success('Account deleted');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Profile & Settings</h2>

      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl
                        flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold">{profile?.username}</h3>
            <p className="text-gray-500 dark:text-dark-200 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {profile?.email}
              {profile?.email_verified ? (
                <span className="flex items-center gap-1 text-green-500 text-xs"><CheckCircle className="w-3 h-3" /> Verified</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500 text-xs"><XCircle className="w-3 h-3" /> Not verified</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Joined {formatDate(profile?.created_at)} · {profile?.login_count || 0} logins
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{profile?.stats?.total_questions || 0}</p>
            <p className="text-xs text-gray-500">Questions</p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{formatTime(profile?.stats?.total_time || 0)}</p>
            <p className="text-xs text-gray-500">Study Time</p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{profile?.mcqStats?.quizzes_taken || 0}</p>
            <p className="text-xs text-gray-500">Quizzes</p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{parseFloat(profile?.mcqStats?.avg_score || 0).toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'profile', label: 'Edit Profile', icon: User },
          { key: 'password', label: 'Change Password', icon: Key },
          { key: 'danger', label: 'Danger Zone', icon: Trash2 }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-500'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Edit Profile */}
      {tab === 'profile' && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={profile?.email || ''} disabled className="input-field opacity-50" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button onClick={handleUpdateProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Change Password */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                   className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                   className="input-field" minLength={6} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                   className="input-field" required />
          </div>
          <button type="submit" disabled={changingPassword} className="btn-primary flex items-center gap-2">
            {changingPassword ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Change Password
          </button>
        </form>
      )}

      {/* Danger Zone */}
      {tab === 'danger' && (
        <div className="card p-6 border-2 border-red-200 dark:border-red-800">
          <h3 className="text-lg font-bold text-red-600 mb-2">Delete Account</h3>
          <p className="text-sm text-gray-500 mb-4">
            This action is permanent. All your data, chat history, MCQ results, and saved media will be permanently deleted.
          </p>
          <button onClick={handleDeleteAccount} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete My Account
          </button>
        </div>
      )}
    </div>
  );
}
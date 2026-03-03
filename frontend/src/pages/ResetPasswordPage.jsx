import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Key, Loader, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset!');
      setDone(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-800 p-4">
        <div className="card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="text-gray-500 mb-4">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-800 to-primary-900 p-4">
      <div className="card p-8 w-full max-w-md">
        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h3 className="text-xl font-bold">Password Reset!</h3>
            <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <Key className="w-12 h-12 text-primary-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold">Create New Password</h2>
            </div>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                   placeholder="New password" className="input-field" minLength={6} required />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                   placeholder="Confirm password" className="input-field" required />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
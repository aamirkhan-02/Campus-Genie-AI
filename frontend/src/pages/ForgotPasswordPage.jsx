import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, Loader, Send, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // email | otp | reset | done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, method: 'otp' });
      toast.success('Reset OTP sent to your email');
      setStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp });
      setResetToken(res.data.data.resetToken);
      toast.success('OTP verified!');
      setStep('reset');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: resetToken,
        newPassword
      });
      toast.success('Password reset successful!');
      setStep('done');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-800 via-dark-900 to-primary-900 
                    flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 
                        rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'done' ? 'All Done!' : 'Reset Password'}
          </h1>
        </div>

        <div className="card p-8">
          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-dark-200 text-center mb-4">
                Enter your email and we'll send you a reset code
              </p>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field pl-12"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Reset Code</>}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-dark-200 text-center mb-4">
                Enter the 6-digit code sent to <span className="text-primary-500">{email}</span>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                maxLength={6}
                inputMode="numeric"
              />
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Verify Code'}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-gray-500 hover:text-primary-500">
                ← Use different email
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-dark-200 text-center mb-4">
                Create your new password
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="input-field"
                minLength={6}
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input-field"
                required
              />
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold">Password Reset Complete!</h3>
              <p className="text-sm text-gray-500">You can now log in with your new password</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                Go to Login <ArrowLeft className="w-5 h-5 rotate-180" />
              </Link>
            </div>
          )}

          {/* Back to Login */}
          {step !== 'done' && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-400 text-center">
              <Link to="/login" className="text-sm text-primary-500 hover:text-primary-400 inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
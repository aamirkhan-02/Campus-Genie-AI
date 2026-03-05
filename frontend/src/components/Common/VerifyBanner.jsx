import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.email_verified || dismissed) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Please verify your email address to unlock all features.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/verify-email')}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm 
                     font-medium inline-flex items-center gap-1 transition-all"
          >
            Verify Now <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
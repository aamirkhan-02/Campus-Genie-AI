import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Image, History,
  Shield, LogOut, Plus, X, ChevronLeft, GraduationCap,
  Camera, Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef } from 'react';
import { SUBJECTS } from '../../utils/constants';
import { authService } from '../../services/authService';
import CropModal from '../Common/CropModal';
import toast from 'react-hot-toast';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showSubjects, setShowSubjects] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const fileInputRef = useRef(null);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
    { path: '/mcq', icon: GraduationCap, label: 'MCQ Practice' },
    { path: '/media', icon: Image, label: 'Media Studio' },
    { path: '/history', icon: History, label: 'History' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin Panel' });
  }

  const handleSubjectClick = (subject) => {
    navigate(`/chat?subject=${encodeURIComponent(subject.name)}`);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // When user picks a file, open the crop modal instead of uploading directly
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
    setShowAvatarMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // After cropping, upload the blob
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
    } finally {
      setShowAvatarMenu(false);
    }
  };

  // Use the proxy path directly (Vite proxies /uploads → backend)
  const avatarUrl = user?.avatar || null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 
        bg-white dark:bg-dark-700 border-r border-gray-200 dark:border-dark-500
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-dark-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600
                            flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                <img
                  src="/campus-genie-logo.png"
                  alt="Campus Genie"
                  className="w-10 h-10 object-cover scale-110"
                />
              </div>
              <div>
                <h1 className="font-bold text-lg gradient-text">Campus Genie</h1>
                <p className="text-xs text-gray-500 dark:text-dark-200">AI Pro</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Subjects Section */}
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-500">
            <button
              onClick={() => setShowSubjects(!showSubjects)}
              className="flex items-center justify-between w-full px-4 py-2 text-sm 
                       font-semibold text-gray-500 dark:text-dark-200 uppercase tracking-wider"
            >
              <span>Subjects</span>
              <ChevronLeft className={`w-4 h-4 transition-transform ${showSubjects ? '-rotate-90' : ''}`} />
            </button>

            {showSubjects && (
              <div className="space-y-0.5 mt-1 animate-fade-in">
                {SUBJECTS.map(subject => (
                  <button
                    key={subject.name}
                    onClick={() => handleSubjectClick(subject)}
                    className="sidebar-item w-full text-left text-sm"
                  >
                    <span>{subject.icon}</span>
                    <span>{subject.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-500">
          <div className="flex items-center gap-3 mb-3 px-2 relative">
            {/* Avatar with click-to-change */}
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              className="relative group flex-shrink-0"
              title="Change profile picture"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.username}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-400/30"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-purple-500 
                              rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            {/* Avatar dropdown menu */}
            {showAvatarMenu && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setShowAvatarMenu(false)} />
                <div className="absolute left-0 bottom-full mb-2 z-50 w-48 py-1 
                              bg-white dark:bg-dark-600 rounded-xl shadow-lg border border-gray-200 
                              dark:border-dark-400 animate-fade-in">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm
                             hover:bg-gray-50 dark:hover:bg-dark-500 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-primary-500" />
                    <span>{user?.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {user?.avatar && (
                    <button
                      onClick={handleAvatarRemove}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500
                               hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-dark-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Crop Modal */}
      {cropImage && (
        <CropModal
          imageSrc={cropImage}
          onCropDone={handleCropDone}
          onClose={() => setCropImage(null)}
        />
      )}
    </>
  );
}
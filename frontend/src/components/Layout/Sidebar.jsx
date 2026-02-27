import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Image, History,
  Shield, LogOut, Plus, X, ChevronLeft, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { SUBJECTS } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSubjects, setShowSubjects] = useState(false);

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
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-purple-500 
                          rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
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
    </>
  );
}
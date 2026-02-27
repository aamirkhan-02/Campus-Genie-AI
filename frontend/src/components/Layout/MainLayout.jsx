import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/chat': 'AI Chat',
  '/mcq': 'MCQ Practice', 
  '/media': 'Media Studio',
  '/history': 'Chat History',
  '/admin': 'Admin Panel'
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const basePath = '/' + location.pathname.split('/')[1];
  const title = pageTitles[basePath] || 'Campus Genie';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-800 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import { Menu, Bell } from 'lucide-react';
import ThemeToggle from '../Common/ThemeToggle';

export default function Header({ onMenuClick, title }) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-200 dark:border-dark-500 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">{title || 'Dashboard'}</h2>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-xl relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
import { MessageSquare, Clock, BookOpen, Flame } from 'lucide-react';
import { formatTime } from '../../utils/helpers';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Questions Asked',
      value: stats?.total_questions || 0,
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      label: 'Study Time',
      value: formatTime(stats?.total_time_seconds || 0),
      icon: Clock,
      color: 'from-green-500 to-emerald-600',
      change: '+8%'
    },
    {
      label: 'Subjects Covered',
      value: stats?.subjects_studied || 0,
      icon: BookOpen,
      color: 'from-purple-500 to-violet-600',
      change: '+3'
    },
    {
      label: 'Current Streak',
      value: `${stats?.current_streak || 0} days`,
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      change: '🔥'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="card p-6 hover:shadow-md transition-shadow animate-fade-in"
             style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl 
                          flex items-center justify-center shadow-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 
                           px-2 py-1 rounded-lg">
              {card.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold">{card.value}</h3>
          <p className="text-sm text-gray-500 dark:text-dark-200 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
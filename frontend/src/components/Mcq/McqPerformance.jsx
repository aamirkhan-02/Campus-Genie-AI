import { useState, useEffect } from 'react';
import { mcqService } from '../../services/mcqService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function McqPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      const result = await mcqService.getPerformance();
      setData(result);
    } catch {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" className="mx-auto" /></div>;
  if (!data) return null;

  const { overall, subjectPerformance, difficultyPerformance, weakTopics, strongTopics, recentTrend } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Quizzes Taken', value: overall.total_quizzes || 0, icon: Target, color: 'from-blue-500 to-blue-600' },
          { label: 'Avg Score', value: `${parseFloat(overall.avg_score || 0).toFixed(1)}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
          { label: 'Best Score', value: `${parseFloat(overall.best_score || 0).toFixed(1)}%`, icon: Award, color: 'from-yellow-500 to-orange-500' },
          { label: 'Total Questions', value: overall.total_questions || 0, icon: Target, color: 'from-purple-500 to-violet-600' }
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl 
                          flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-dark-200">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Score by Subject</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance.map(s => ({
                subject: s.subject_name.length > 10 ? s.subject_name.substring(0, 10) + '...' : s.subject_name,
                score: parseFloat(s.avg_score).toFixed(1)
              }))}>
                <XAxis dataKey="subject" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip />
                <Bar dataKey="score" fill="#5c7cfa" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Recent Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentTrend.map((t, i) => ({
                quiz: `#${i + 1}`,
                score: parseFloat(t.score_percentage).toFixed(1)
              }))}>
                <XAxis dataKey="quiz" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#5c7cfa" strokeWidth={3}
                      dot={{ fill: '#5c7cfa', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="card p-6">
        <h3 className="text-lg font-bold mb-4">Performance by Difficulty</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {difficultyPerformance.map(d => {
            const accuracy = d.total_questions > 0 
              ? ((d.total_correct / d.total_questions) * 100).toFixed(1) 
              : 0;
            const colorMap = { easy: 'green', medium: 'orange', hard: 'red' };
            const color = colorMap[d.difficulty] || 'gray';
            
            return (
              <div key={d.difficulty} className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-900/10 
                                                  border border-${color}-200 dark:border-${color}-800`}>
                <h4 className="font-bold capitalize text-lg mb-2">{d.difficulty}</h4>
                <div className="space-y-1 text-sm">
                  <p>Quizzes: <span className="font-semibold">{d.quizzes}</span></p>
                  <p>Accuracy: <span className="font-semibold">{accuracy}%</span></p>
                  <p>Correct: <span className="font-semibold">{d.total_correct}/{d.total_questions}</span></p>
                </div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-500 rounded-full overflow-hidden">
                  <div className={`h-full bg-${color}-500 rounded-full`} 
                       style={{ width: `${accuracy}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak & Strong Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold">Weak Topics</h3>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-gray-500">Take more quizzes to see weak areas</p>
          ) : (
            <div className="space-y-2">
              {weakTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm">
                  <div>
                    <p className="font-medium">{t.topic}</p>
                    <p className="text-xs text-gray-500">{t.subject_name} · {t.difficulty}</p>
                  </div>
                  <span className="font-bold text-red-600">{parseFloat(t.accuracy).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold">Strong Topics</h3>
          </div>
          {strongTopics.length === 0 ? (
            <p className="text-sm text-gray-500">Take more quizzes to see strong areas</p>
          ) : (
            <div className="space-y-2">
              {strongTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl text-sm">
                  <div>
                    <p className="font-medium">{t.topic}</p>
                    <p className="text-xs text-gray-500">{t.subject_name} · {t.difficulty}</p>
                  </div>
                  <span className="font-bold text-green-600">{parseFloat(t.accuracy).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
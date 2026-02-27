import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function StudyChart({ data }) {
  const chartData = data?.map(item => ({
    date: new Date(item.session_date).toLocaleDateString('en-US', { weekday: 'short' }),
    questions: item.questions
  })) || [];

  // Fill missing days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (today - i + 7) % 7;
    const dayName = days[dayIndex];
    const existing = chartData.find(d => d.date === dayName);
    last7Days.push({ date: dayName, questions: existing?.questions || 0 });
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold mb-6">Weekly Activity</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1A1B1E', 
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#fff'
              }}
            />
            <Bar 
              dataKey="questions" 
              fill="url(#colorGradient)" 
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5c7cfa" />
                <stop offset="100%" stopColor="#4263eb" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
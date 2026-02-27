import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

export default function WeakAreas({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Weak Areas */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">Areas to Improve</h3>
        </div>
        
        {data.weak_areas?.length > 0 ? (
          <div className="space-y-3">
            {data.weak_areas.map((area, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 
                                    rounded-xl border border-amber-100 dark:border-amber-800/30">
                <span className="text-amber-500 font-bold text-sm">!</span>
                <span className="text-sm">{area}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No weak areas detected yet. Keep studying!</p>
        )}

        {data.unstudied_subjects?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-400">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Not yet explored</p>
            <div className="flex flex-wrap gap-2">
              {data.unstudied_subjects.map((subject, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-dark-500 rounded-full text-xs">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-bold">AI Suggestions</h3>
        </div>

        {data.ai_suggestions?.length > 0 ? (
          <div className="space-y-3">
            {data.ai_suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-900/10 
                                    rounded-xl border border-primary-100 dark:border-primary-800/30">
                <TrendingUp className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{suggestion}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Start studying to get personalized suggestions!</p>
        )}
      </div>
    </div>
  );
}
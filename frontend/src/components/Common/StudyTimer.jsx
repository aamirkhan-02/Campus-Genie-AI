import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

export default function StudyTimer({ subject }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const savedRef = useRef(0);

  useEffect(() => {
    return () => {
      // Save time when component unmounts
      if (seconds > savedRef.current && seconds - savedRef.current > 10) {
        dashboardService.updateTimeSpent(subject || 'General', seconds - savedRef.current).catch(() => {});
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [seconds, subject]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Save accumulated time when paused
      if (seconds > savedRef.current && seconds - savedRef.current > 10) {
        dashboardService.updateTimeSpent(subject || 'General', seconds - savedRef.current).catch(() => {});
        savedRef.current = seconds;
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsRunning(false);
    if (seconds > savedRef.current) {
      dashboardService.updateTimeSpent(subject || 'General', seconds - savedRef.current).catch(() => {});
    }
    setSeconds(0);
    savedRef.current = 0;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-500 rounded-xl px-3 py-1.5">
      <Timer className="w-4 h-4 text-gray-400" />
      <span className="font-mono text-sm font-medium min-w-[50px]">{formatTime(seconds)}</span>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className={`p-1 rounded-lg transition-all ${
          isRunning ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
        }`}
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      {seconds > 0 && (
        <button onClick={reset} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
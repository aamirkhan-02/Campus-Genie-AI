import { useState } from 'react';
import { BookOpen, Trophy, History, Bookmark } from 'lucide-react';
import McqSetup from '../components/Mcq/McqSetup';
import McqQuiz from '../components/Mcq/McqQuiz';
import McqResults from '../components/Mcq/McqResults';
import McqHistory from '../components/Mcq/McqHistory';
import McqPerformance from '../components/Mcq/McqPerformance';
import McqBookmarks from '../components/Mcq/McqBookmarks';

export default function McqPage() {
  const [activeTab, setActiveTab] = useState('practice');
  const [quizState, setQuizState] = useState('setup'); // setup | quiz | results
  const [quizData, setQuizData] = useState(null);
  const [results, setResults] = useState(null);

  const handleQuizStart = (data) => {
    setQuizData(data);
    setQuizState('quiz');
  };

  const handleQuizComplete = (resultData) => {
    setResults(resultData);
    setQuizState('results');
  };

  const handleRetry = () => {
    setQuizState('setup');
    setQuizData(null);
    setResults(null);
  };

  const tabs = [
    { key: 'practice', label: 'Practice', icon: BookOpen },
    { key: 'performance', label: 'Performance', icon: Trophy },
    { key: 'history', label: 'History', icon: History },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">MCQ Practice</h2>
        <p className="text-gray-500 dark:text-dark-200">
          Test your knowledge with AI-generated questions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'practice') handleRetry();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium 
                       transition-all whitespace-nowrap
              ${activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'practice' && (
        <>
          {quizState === 'setup' && <McqSetup onStart={handleQuizStart} />}
          {quizState === 'quiz' && (
            <McqQuiz 
              quizData={quizData} 
              onComplete={handleQuizComplete}
              onQuit={handleRetry}
            />
          )}
          {quizState === 'results' && (
            <McqResults 
              results={results} 
              onRetry={handleRetry}
            />
          )}
        </>
      )}

      {activeTab === 'performance' && <McqPerformance />}
      {activeTab === 'history' && <McqHistory />}
      {activeTab === 'bookmarks' && <McqBookmarks />}
    </div>
  );
}
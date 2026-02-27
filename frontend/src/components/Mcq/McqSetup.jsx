import { useState, useEffect } from 'react';
import { mcqService } from '../../services/mcqService';
import { Play, Loader, ChevronRight, Zap, Flame, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTIES = [
  {
    key: 'easy',
    label: 'Easy',
    icon: Zap,
    color: 'from-green-400 to-emerald-500',
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    desc: 'Basic definitions, recall, simple concepts'
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: Brain,
    color: 'from-yellow-400 to-orange-500',
    border: 'border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    desc: 'Application, scenario-based, analytical'
  },
  {
    key: 'hard',
    label: 'Hard',
    icon: Flame,
    color: 'from-red-400 to-rose-600',
    border: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    desc: 'Tricky options, edge cases, deep understanding'
  }
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

export default function McqSetup({ onStart }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject);
    }
  }, [selectedSubject]);

  const loadSubjects = async () => {
    try {
      const data = await mcqService.getSubjectsWithTopics();
      setSubjects(data);
    } catch {
      toast.error('Failed to load subjects');
    }
  };

  const loadTopics = async (subject) => {
    setLoadingTopics(true);
    try {
      const data = await mcqService.getTopics(subject);
      setTopics(data.topics);
    } catch {
      toast.error('Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleGenerate = async () => {
    const topic = selectedTopic || customTopic;
    if (!selectedSubject || !topic) {
      toast.error('Please select a subject and topic');
      return;
    }

    setLoading(true);
    try {
      const data = await mcqService.generateQuiz({
        subject: selectedSubject,
        topic,
        difficulty,
        numberOfQuestions: numQuestions
      });
      toast.success(`${data.totalQuestions} questions generated!`);
      onStart(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const subjectIcons = {
    'DBMS': '🗄️', 'C Programming': '©️', 'Java': '☕', 'Python': '🐍',
    'Data Structures': '🌳', 'Algorithms': '⚙️', 'Operating Systems': '💻',
    'Computer Networks': '🌐', 'Aptitude': '🧮', 'System Design': '🏗️'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Select Subject */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center 
                        justify-center font-bold text-sm">1</div>
          <h3 className="text-lg font-bold">Choose Subject</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {subjects.map(subject => (
            <button
              key={subject.name}
              onClick={() => {
                setSelectedSubject(subject.name);
                setSelectedTopic('');
                setStep(2);
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 
                         transition-all hover:shadow-md
                ${selectedSubject === subject.name
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                  : 'border-gray-200 dark:border-dark-400 hover:border-primary-300'
                }`}
            >
              <span className="text-2xl">{subjectIcons[subject.name] || '📚'}</span>
              <span className="text-xs font-medium text-center">{subject.name}</span>
              {subject.performance.quizzesTaken > 0 && (
                <span className="text-[10px] px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 
                               text-primary-600 rounded-full">
                  Avg: {subject.performance.avgAccuracy}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Topic */}
      {selectedSubject && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center 
                          justify-center font-bold text-sm">2</div>
            <h3 className="text-lg font-bold">Choose Topic — {selectedSubject}</h3>
          </div>

          {loadingTopics ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {topics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTopic(topic.name);
                      setCustomTopic('');
                      setStep(3);
                    }}
                    className={`flex items-center gap-2 p-3 rounded-xl text-sm text-left 
                               transition-all border
                      ${selectedTopic === topic.name
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 font-medium'
                        : 'border-gray-200 dark:border-dark-400 hover:border-primary-300'
                      }`}
                  >
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform
                      ${selectedTopic === topic.name ? 'text-primary-500 rotate-90' : 'text-gray-400'}`} 
                    />
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom topic input */}
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-dark-400">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setSelectedTopic('');
                  }}
                  placeholder="Or type a custom topic..."
                  className="input-field flex-1"
                />
                {customTopic && (
                  <button
                    onClick={() => setStep(3)}
                    className="btn-primary px-4"
                  >
                    Select
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Difficulty & Count */}
      {(selectedTopic || customTopic) && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center 
                          justify-center font-bold text-sm">3</div>
            <h3 className="text-lg font-bold">Select Difficulty & Number of Questions</h3>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">Difficulty Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`p-4 rounded-xl border-2 transition-all text-left
                    ${difficulty === d.key
                      ? `${d.border} ${d.bg} shadow-md`
                      : 'border-gray-200 dark:border-dark-400 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 bg-gradient-to-br ${d.color} rounded-lg 
                                  flex items-center justify-center`}>
                      <d.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold">{d.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-200">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">
              Number of Questions
            </label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNTS.map(count => (
                <button
                  key={count}
                  onClick={() => setNumQuestions(count)}
                  className={`w-14 h-14 rounded-xl font-bold text-lg transition-all
                    ${numQuestions === count
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Summary & Start */}
          <div className="bg-gray-50 dark:bg-dark-500 rounded-xl p-4 mb-4">
            <h4 className="font-semibold mb-2">Quiz Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-dark-200">Subject:</span>
                <p className="font-medium">{selectedSubject}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-200">Topic:</span>
                <p className="font-medium">{selectedTopic || customTopic}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-200">Level:</span>
                <p className="font-medium capitalize">{difficulty}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-200">Questions:</span>
                <p className="font-medium">{numQuestions}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating {numQuestions} Questions...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Quiz
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
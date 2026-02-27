import { useState, useEffect } from 'react';
import { youtubeService } from '../../services/youtubeService';
import { SUBJECTS } from '../../utils/constants';
import {
  Search, Play, ExternalLink, ThumbsUp, Eye, Clock,
  BookmarkPlus, BookmarkCheck, Loader, ChevronDown, X,
  Globe, Filter, SortAsc, Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

// Full language list with flags
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'viewCount', label: 'Most Viewed' },
  { value: 'date', label: 'Newest First' },
  { value: 'rating', label: 'Top Rated' }
];

const DURATION_OPTIONS = [
  { value: 'any', label: 'Any Duration' },
  { value: 'short', label: 'Short (< 4 min)' },
  { value: 'medium', label: 'Medium (4–20 min)' },
  { value: 'long', label: 'Long (> 20 min)' }
];

export default function VideoGenerator() {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('ytLang') || 'en';
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [duration, setDuration] = useState('any');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [showSaved, setShowSaved] = useState(false);
  const [savedVideos, setSavedVideos] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [resultInfo, setResultInfo] = useState(null);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('ytLang', language);
  }, [language]);

  // Load recommended when subject or language changes
  useEffect(() => {
    if (subject) {
      loadRecommended(subject);
    }
  }, [subject, language]);

  const searchVideos = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActiveVideo(null);
    try {
      const result = await youtubeService.searchVideos({
        query,
        subject,
        language,
        maxResults: 12,
        order: sortBy,
        duration
      });
      setVideos(result.videos);
      setResultInfo({
        total: result.totalResults,
        query: result.query,
        lang: result.languageName
      });
      if (result.videos.length === 0) {
        toast('No videos found. Try different keywords or language.', { icon: '🔍' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommended = async (subj) => {
    setLoading(true);
    setActiveVideo(null);
    try {
      const result = await youtubeService.getRecommended(subj, language);
      setVideos(result.videos);
      setResultInfo({
        total: result.videos.length,
        query: `Recommended for ${subj}`,
        lang: result.languageName
      });
    } catch (error) {
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const saveVideo = async (video) => {
    try {
      await youtubeService.saveVideo({
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnail: video.thumbnail?.high || video.thumbnail,
        subject: subject || 'General',
        topic: query || '',
        language
      });
      setSavedIds(prev => new Set([...prev, video.videoId]));
      toast.success('Video saved!');
    } catch (error) {
      if (error.response?.status === 409) {
        toast('Already saved', { icon: '📌' });
      } else {
        toast.error('Failed to save');
      }
    }
  };

  const loadSavedVideos = async () => {
    try {
      const data = await youtubeService.getSavedVideos();
      setSavedVideos(data);
      setShowSaved(true);
    } catch {
      toast.error('Failed to load saved videos');
    }
  };

  const deleteSaved = async (id) => {
    try {
      await youtubeService.deleteSavedVideo(id);
      setSavedVideos(prev => prev.filter(v => v.id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const selectedLang = LANGUAGES.find(l => l.code === language);

  const filteredLangs = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const quickSearches = [
    'Binary Search Tree explained',
    'SQL Joins tutorial',
    'TCP three way handshake',
    'OOP concepts in Java',
    'Python list comprehension',
    'Process scheduling in OS',
    'Normalization in DBMS',
    'Dynamic programming for beginners'
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl
                          flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">YouTube Learning Videos</h3>
              <p className="text-sm text-gray-500 dark:text-dark-200">
                Find educational videos in your preferred language
              </p>
            </div>
          </div>
        </div>

        {/* Language + Subject + Search Row */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Row 1: Language and Subject */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Language Picker */}
            <div className="relative">
              <button
                onClick={() => { setShowLangPicker(!showLangPicker); setShowSubjectPicker(false); }}
                className="input-field w-full sm:w-56 flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="flex items-center gap-2 flex-1">
                  <span>{selectedLang?.flag}</span>
                  <span>{selectedLang?.name}</span>
                  <span className="text-xs text-gray-400">({selectedLang?.native})</span>
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showLangPicker && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-dark-600
                              rounded-xl shadow-2xl border border-gray-200 dark:border-dark-400
                              z-50 animate-fade-in overflow-hidden">
                  {/* Language Search */}
                  <div className="p-3 border-b border-gray-100 dark:border-dark-400">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={langSearch}
                        onChange={(e) => setLangSearch(e.target.value)}
                        placeholder="Search language..."
                        className="input-field pl-9 py-2 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Popular Languages */}
                  {!langSearch && (
                    <div className="p-2 border-b border-gray-100 dark:border-dark-400">
                      <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Popular
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['en', 'hi', 'ta', 'te', 'es', 'fr', 'de', 'ja'].map(code => {
                          const lang = LANGUAGES.find(l => l.code === code);
                          if (!lang) return null;
                          return (
                            <button
                              key={code}
                              onClick={() => {
                                setLanguage(code);
                                setShowLangPicker(false);
                                setLangSearch('');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1
                                         transition-all
                                ${language === code
                                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 font-medium'
                                  : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                                }`}
                            >
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Full Language List */}
                  <div className="max-h-60 overflow-y-auto">
                    {!langSearch && (
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        All Languages
                      </p>
                    )}
                    {filteredLangs.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangPicker(false);
                          setLangSearch('');
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                                  hover:bg-gray-50 dark:hover:bg-dark-500 transition-all
                                  ${language === lang.code
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-medium'
                                    : ''
                                  }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <div className="flex-1">
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{lang.native}</span>
                        </div>
                        {language === lang.code && (
                          <span className="text-primary-500 text-xs">✓</span>
                        )}
                      </button>
                    ))}
                    {filteredLangs.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-gray-400">
                        No language found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowSubjectPicker(!showSubjectPicker); setShowLangPicker(false); }}
                className="input-field w-full sm:w-48 flex items-center justify-between cursor-pointer"
              >
                <span className={subject ? 'text-current' : 'text-gray-400'}>
                  {subject || 'All Subjects'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showSubjectPicker && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-dark-600
                              rounded-xl shadow-xl border border-gray-200 dark:border-dark-400
                              z-50 max-h-64 overflow-y-auto animate-fade-in">
                  <button
                    onClick={() => { setSubject(''); setShowSubjectPicker(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 
                              dark:hover:bg-dark-500 ${!subject ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  >
                    All Subjects
                  </button>
                  {SUBJECTS.map(s => (
                    <button
                      key={s.name}
                      onClick={() => { setSubject(s.name); setShowSubjectPicker(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left
                                hover:bg-gray-50 dark:hover:bg-dark-500
                                ${subject === s.name ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`input-field w-auto flex items-center gap-2 cursor-pointer
                ${showFilters ? 'border-primary-500 text-primary-500' : ''}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filters Row (collapsible) */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 dark:bg-dark-500 
                          rounded-xl animate-fade-in">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <SortAsc className="w-3 h-3 inline mr-1" />Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <Timer className="w-3 h-3 inline mr-1" />Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Search Input Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchVideos()}
                placeholder={`Search in ${selectedLang?.name || 'English'}...`}
                className="input-field pl-12"
              />
            </div>
            <button onClick={searchVideos} disabled={loading} className="btn-primary px-6">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Active Language Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Searching in:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/20
                         text-primary-600 rounded-full text-xs font-medium">
            <span>{selectedLang?.flag}</span>
            <span>{selectedLang?.name}</span>
            <span className="text-gray-400">({selectedLang?.native})</span>
          </span>
          {subject && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-dark-500
                           rounded-full text-xs font-medium">
              {subject}
              <button onClick={() => setSubject('')} className="ml-1 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Quick Searches */}
        <div className="flex flex-wrap gap-2">
          {quickSearches.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-dark-500 rounded-lg text-xs
                       hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
            >
              ▶ {q}
            </button>
          ))}
        </div>

        {/* Bottom Bar: Saved Videos + Result Info */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-400 
                      flex items-center justify-between">
          <button
            onClick={loadSavedVideos}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <BookmarkCheck className="w-4 h-4" />
            Saved Videos
          </button>

          {resultInfo && (
            <p className="text-xs text-gray-400">
              {resultInfo.total} results · {resultInfo.lang} · "{resultInfo.query}"
            </p>
          )}
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showLangPicker || showSubjectPicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowLangPicker(false); setShowSubjectPicker(false); }}
        />
      )}

      {/* Video Player */}
      {activeVideo && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="relative pb-[56.25%] bg-black">
            <iframe
              src={`${activeVideo.embedUrl}?autoplay=1&rel=0`}
              title={activeVideo.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">{activeVideo.title}</h3>
                <p className="text-sm text-gray-500 dark:text-dark-200 mb-2">
                  {activeVideo.channelTitle}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {activeVideo.viewsFormatted} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> {activeVideo.likesFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {activeVideo.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {LANGUAGES.find(l => l.code === (activeVideo.language || language))?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => saveVideo(activeVideo)}
                  className={`p-2.5 rounded-xl transition-all ${
                    savedIds.has(activeVideo.videoId)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                  }`}
                  title="Save video"
                >
                  {savedIds.has(activeVideo.videoId)
                    ? <BookmarkCheck className="w-5 h-5" />
                    : <BookmarkPlus className="w-5 h-5" />
                  }
                </button>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 
                           dark:hover:bg-dark-400 rounded-xl"
                  title="Open in YouTube"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {activeVideo.description && (
              <p className="mt-3 text-sm text-gray-600 dark:text-dark-100 line-clamp-3">
                {activeVideo.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div
              key={video.videoId}
              onClick={() => setActiveVideo(video)}
              className={`card overflow-hidden cursor-pointer hover:shadow-lg transition-all
                         group ${activeVideo?.videoId === video.videoId ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className="relative">
                <img
                  src={video.thumbnail?.high || video.thumbnail?.medium || video.thumbnail}
                  alt={video.title}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white 
                               text-xs font-medium rounded">
                  {video.duration}
                </span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 
                              flex items-center justify-center transition-all">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center
                                opacity-0 group-hover:opacity-100 transition-all transform 
                                scale-75 group-hover:scale-100">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary-500 
                             transition-colors">
                  {video.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-dark-200 mb-2">
                  {video.channelTitle}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {video.viewsFormatted}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> {video.likesFormatted}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); saveVideo(video); }}
                    className={`p-1.5 rounded-lg transition-all ${
                      savedIds.has(video.videoId)
                        ? 'text-green-500'
                        : 'text-gray-300 hover:text-primary-500'
                    }`}
                  >
                    {savedIds.has(video.videoId)
                      ? <BookmarkCheck className="w-4 h-4" />
                      : <BookmarkPlus className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Searching YouTube in {selectedLang?.name}...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div className="card p-12 text-center">
          <Play className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Find Learning Videos</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select a subject, choose your language, and search for any topic
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['en', 'hi', 'ta', 'te', 'es', 'fr'].map(code => {
              const l = LANGUAGES.find(x => x.code === code);
              return (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5
                    ${language === code
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                    }`}
                >
                  <span>{l?.flag}</span>
                  <span>{l?.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Videos Modal */}
      {showSaved && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
             onClick={() => setShowSaved(false)}>
          <div className="bg-white dark:bg-dark-600 rounded-2xl w-full max-w-2xl max-h-[80vh] 
                        overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 
                          dark:border-dark-400">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-primary-500" />
                Saved Videos ({savedVideos.length})
              </h3>
              <button onClick={() => setShowSaved(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-5 space-y-3">
              {savedVideos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No saved videos yet</p>
              ) : (
                savedVideos.map(video => (
                  <div key={video.id} className="flex items-center gap-4 p-3 bg-gray-50 
                                                dark:bg-dark-500 rounded-xl">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{video.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{video.channelTitle}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{video.subject}</span>
                        {video.language && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {LANGUAGES.find(l => l.code === video.language)?.name || video.language}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-200 dark:hover:bg-dark-400 rounded-lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteSaved(video.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 
                                 text-red-500 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
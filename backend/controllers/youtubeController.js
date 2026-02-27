const https = require('https');
const pool = require('../config/db');

// ============================================
// HELPER: Make HTTPS GET request
// ============================================
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

// ============================================
// SUPPORTED LANGUAGES
// ============================================
const SUPPORTED_LANGUAGES = [
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
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', native: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' }
];

// Language keyword hints added to search query for better results
const LANGUAGE_SEARCH_HINTS = {
  'hi': 'in Hindi',
  'ta': 'in Tamil',
  'te': 'in Telugu',
  'kn': 'in Kannada',
  'ml': 'in Malayalam',
  'mr': 'in Marathi',
  'bn': 'in Bengali / Bangla',
  'gu': 'in Gujarati',
  'pa': 'in Punjabi',
  'ur': 'in Urdu',
};

const SUBJECT_SEARCH_HINTS = {
  'DBMS': 'database management system tutorial',
  'C Programming': 'C programming language tutorial',
  'Java': 'java programming tutorial',
  'Python': 'python programming tutorial',
  'Data Structures': 'data structures and algorithms tutorial',
  'Algorithms': 'algorithms explained tutorial',
  'Operating Systems': 'operating systems concepts tutorial',
  'Computer Networks': 'computer networking tutorial',
  'Aptitude': 'quantitative aptitude tutorial',
  'System Design': 'system design interview tutorial'
};

// ============================================
// GET SUPPORTED LANGUAGES LIST
// ============================================
exports.getLanguages = async (req, res) => {
  res.json({
    success: true,
    data: SUPPORTED_LANGUAGES
  });
};

// ============================================
// SEARCH YOUTUBE VIDEOS
// ============================================
exports.searchVideos = async (req, res, next) => {
  try {
    const { query, subject, topic, language, maxResults, order, duration } = req.query;

    if (!query && !topic) {
      return res.status(400).json({
        success: false,
        message: 'Provide a query or topic to search'
      });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey || apiKey.includes('your-')) {
      return res.status(503).json({
        success: false,
        message: 'YouTube API key not configured'
      });
    }

    // Build search query
    let searchQuery = query || topic;

    // Add subject context
    if (subject && SUBJECT_SEARCH_HINTS[subject]) {
      searchQuery = `${searchQuery} ${SUBJECT_SEARCH_HINTS[subject]}`;
    } else if (subject) {
      searchQuery = `${searchQuery} ${subject} tutorial`;
    }

    // Add language hint to search query for non-English
    const lang = language || 'en';
    if (lang !== 'en' && LANGUAGE_SEARCH_HINTS[lang]) {
      searchQuery = `${searchQuery} ${LANGUAGE_SEARCH_HINTS[lang]}`;
    }

    // Add tutorial keyword if missing
    const eduKeywords = ['tutorial', 'explained', 'lecture', 'course', 'learn'];
    const hasEduKeyword = eduKeywords.some(k => searchQuery.toLowerCase().includes(k));
    if (!hasEduKeyword && lang === 'en') {
      searchQuery += ' explained tutorial';
    }

    const limit = Math.min(parseInt(maxResults) || 12, 25);

    // Build YouTube API URL
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: limit.toString(),
      order: order || 'relevance',
      relevanceLanguage: lang,
      safeSearch: 'strict',
      key: apiKey
    });

    // Video duration filter
    const durationFilter = duration || 'any';
    if (durationFilter !== 'any') {
      params.set('videoDuration', durationFilter); // short, medium, long
    }

    // Add video caption filter for specific languages
    if (lang !== 'en') {
      params.set('videoCaption', 'any');
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const searchData = await httpsGet(searchUrl);

    if (searchData.error) {
      return res.status(searchData.error.code || 500).json({
        success: false,
        message: searchData.error.message || 'YouTube API error',
        details: searchData.error.errors
      });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return res.json({
        success: true,
        data: {
          videos: [],
          totalResults: 0,
          query: searchQuery,
          language: lang,
          languageName: SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || lang
        }
      });
    }

    // Get video details
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=statistics,contentDetails` +
      `&id=${videoIds}` +
      `&key=${apiKey}`;

    const detailsData = await httpsGet(detailsUrl);

    const detailsMap = {};
    if (detailsData.items) {
      detailsData.items.forEach(item => {
        detailsMap[item.id] = {
          views: parseInt(item.statistics?.viewCount || 0),
          likes: parseInt(item.statistics?.likeCount || 0),
          comments: parseInt(item.statistics?.commentCount || 0),
          duration: parseDuration(item.contentDetails?.duration || 'PT0S')
        };
      });
    }

    const videos = searchData.items.map(item => {
      const videoId = item.id.videoId;
      const details = detailsMap[videoId] || {};

      return {
        videoId,
        title: decodeHtml(item.snippet.title),
        description: decodeHtml(item.snippet.description),
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        thumbnail: {
          default: item.snippet.thumbnails?.default?.url,
          medium: item.snippet.thumbnails?.medium?.url,
          high: item.snippet.thumbnails?.high?.url
        },
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        views: details.views || 0,
        likes: details.likes || 0,
        comments: details.comments || 0,
        duration: details.duration || '0:00',
        viewsFormatted: formatNumber(details.views || 0),
        likesFormatted: formatNumber(details.likes || 0),
        language: lang
      };
    });

    // Save to study stats
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO study_stats (user_id, subject_name, questions_asked, session_date)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE questions_asked = questions_asked + 1`,
      [req.user.id, subject || 'General', today]
    ).catch(() => {});

    res.json({
      success: true,
      data: {
        videos,
        totalResults: searchData.pageInfo?.totalResults || videos.length,
        resultsPerPage: videos.length,
        query: searchQuery,
        language: lang,
        languageName: SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || lang
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET RECOMMENDED VIDEOS FOR A SUBJECT
// ============================================
exports.getRecommended = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const { language } = req.query;

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey.includes('your-')) {
      return res.status(503).json({
        success: false,
        message: 'YouTube API key not configured'
      });
    }

    const lang = language || 'en';

    const recommendedQueries = {
      'DBMS': [
        'DBMS complete course for beginners',
        'SQL tutorial full course',
        'Database normalization explained'
      ],
      'C Programming': [
        'C programming full course beginners',
        'C pointers complete tutorial',
        'C programming projects for beginners'
      ],
      'Java': [
        'Java full course for beginners 2024',
        'Java OOP concepts explained',
        'Java collections framework tutorial'
      ],
      'Python': [
        'Python full course for beginners 2024',
        'Python projects for beginners',
        'Python data structures tutorial'
      ],
      'Data Structures': [
        'Data structures full course',
        'DSA for coding interviews',
        'Linked list stack queue tutorial'
      ],
      'Algorithms': [
        'Algorithms full course beginners',
        'Dynamic programming tutorial',
        'Sorting algorithms visualized'
      ],
      'Operating Systems': [
        'Operating systems full course',
        'OS process scheduling explained',
        'Virtual memory paging tutorial'
      ],
      'Computer Networks': [
        'Computer networks full course',
        'OSI model explained simply',
        'TCP IP networking tutorial'
      ],
      'Aptitude': [
        'Quantitative aptitude shortcuts',
        'Aptitude tricks for placements',
        'Logical reasoning tutorial'
      ],
      'System Design': [
        'System design interview complete guide',
        'System design basics for beginners',
        'Scalability and load balancing explained'
      ]
    };

    const queries = recommendedQueries[subject] || [`${subject} complete tutorial`];

    let searchQuery = queries[0];
    if (lang !== 'en' && LANGUAGE_SEARCH_HINTS[lang]) {
      searchQuery = `${searchQuery} ${LANGUAGE_SEARCH_HINTS[lang]}`;
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: '8',
      order: 'viewCount',
      relevanceLanguage: lang,
      videoDuration: 'long',
      safeSearch: 'strict',
      key: apiKey
    });

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const searchData = await httpsGet(searchUrl);

    if (searchData.error) {
      return res.status(500).json({
        success: false,
        message: searchData.error.message
      });
    }

    const videoIds = (searchData.items || []).map(item => item.id.videoId).join(',');

    let detailsMap = {};
    if (videoIds) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
        `part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;

      const detailsData = await httpsGet(detailsUrl);
      if (detailsData.items) {
        detailsData.items.forEach(item => {
          detailsMap[item.id] = {
            views: parseInt(item.statistics?.viewCount || 0),
            likes: parseInt(item.statistics?.likeCount || 0),
            duration: parseDuration(item.contentDetails?.duration || 'PT0S')
          };
        });
      }
    }

    const videos = (searchData.items || []).map(item => {
      const videoId = item.id.videoId;
      const details = detailsMap[videoId] || {};
      return {
        videoId,
        title: decodeHtml(item.snippet.title),
        description: decodeHtml(item.snippet.description),
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        views: details.views || 0,
        likes: details.likes || 0,
        duration: details.duration || '0:00',
        viewsFormatted: formatNumber(details.views || 0),
        likesFormatted: formatNumber(details.likes || 0),
        language: lang
      };
    });

    res.json({
      success: true,
      data: {
        subject,
        language: lang,
        languageName: SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || lang,
        suggestedSearches: queries,
        videos
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET TOPIC-SPECIFIC VIDEOS
// ============================================
exports.getTopicVideos = async (req, res, next) => {
  try {
    const { subject, topic, language } = req.query;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Subject and topic are required'
      });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey.includes('your-')) {
      return res.status(503).json({
        success: false,
        message: 'YouTube API key not configured'
      });
    }

    const lang = language || 'en';
    let searchQuery = `${topic} in ${subject} explained tutorial`;

    if (lang !== 'en' && LANGUAGE_SEARCH_HINTS[lang]) {
      searchQuery = `${topic} ${subject} ${LANGUAGE_SEARCH_HINTS[lang]}`;
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: '8',
      order: 'relevance',
      relevanceLanguage: lang,
      safeSearch: 'strict',
      key: apiKey
    });

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const searchData = await httpsGet(searchUrl);

    if (searchData.error) {
      return res.status(500).json({
        success: false,
        message: searchData.error.message
      });
    }

    const videoIds = (searchData.items || []).map(item => item.id.videoId).join(',');

    let detailsMap = {};
    if (videoIds) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
        `part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;

      const detailsData = await httpsGet(detailsUrl);
      if (detailsData.items) {
        detailsData.items.forEach(item => {
          detailsMap[item.id] = {
            views: parseInt(item.statistics?.viewCount || 0),
            likes: parseInt(item.statistics?.likeCount || 0),
            duration: parseDuration(item.contentDetails?.duration || 'PT0S')
          };
        });
      }
    }

    const videos = (searchData.items || []).map(item => {
      const videoId = item.id.videoId;
      const details = detailsMap[videoId] || {};
      return {
        videoId,
        title: decodeHtml(item.snippet.title),
        description: decodeHtml(item.snippet.description),
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        views: details.views || 0,
        likes: details.likes || 0,
        duration: details.duration || '0:00',
        viewsFormatted: formatNumber(details.views || 0),
        likesFormatted: formatNumber(details.likes || 0),
        language: lang
      };
    });

    res.json({
      success: true,
      data: { subject, topic, language: lang, videos, totalResults: videos.length }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SAVE VIDEO
// ============================================
exports.saveVideo = async (req, res, next) => {
  try {
    const { videoId, title, channelTitle, thumbnail, subject, topic, language } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({
        success: false,
        message: 'videoId and title are required'
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM generated_media WHERE user_id = ? AND media_type = 'video' AND url = ?",
      [req.user.id, `https://www.youtube.com/watch?v=${videoId}`]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Video already saved'
      });
    }

    await pool.query(
      `INSERT INTO generated_media (user_id, media_type, prompt, url, file_path, status)
       VALUES (?, 'video', ?, ?, ?, 'completed')`,
      [
        req.user.id,
        JSON.stringify({ title, channelTitle, subject, topic, language }),
        `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail || ''
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Video saved to your library'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SAVED VIDEOS
// ============================================
exports.getSavedVideos = async (req, res, next) => {
  try {
    const [videos] = await pool.query(
      "SELECT * FROM generated_media WHERE user_id = ? AND media_type = 'video' AND status = 'completed' ORDER BY created_at DESC",
      [req.user.id]
    );

    const formatted = videos.map(v => {
      let meta = {};
      try { meta = JSON.parse(v.prompt); } catch {}
      return {
        id: v.id,
        videoId: v.url?.split('v=')[1] || '',
        title: meta.title || 'Saved Video',
        channelTitle: meta.channelTitle || '',
        subject: meta.subject || '',
        topic: meta.topic || '',
        language: meta.language || 'en',
        url: v.url,
        thumbnail: v.file_path,
        savedAt: v.created_at
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE SAVED VIDEO
// ============================================
exports.deleteSavedVideo = async (req, res, next) => {
  try {
    await pool.query(
      "DELETE FROM generated_media WHERE id = ? AND user_id = ? AND media_type = 'video'",
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Video removed' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
import { useState } from 'react';
import { Image, Play } from 'lucide-react';
import ImageGenerator from '../components/Media/ImageGenerator';
import VideoGenerator from '../components/Media/VideoGenerator';

export default function MediaPage() {
  const [tab, setTab] = useState('videos');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Media Studio</h2>
        <p className="text-gray-500 dark:text-dark-200">
          Find educational videos and generate AI diagrams
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('videos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all
            ${tab === 'videos'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
              : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
        >
          <Play className="w-5 h-5" />
          YouTube Videos
        </button>
        <button
          onClick={() => setTab('image')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all
            ${tab === 'image'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
              : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
        >
          <Image className="w-5 h-5" />
          AI Image Generator
        </button>
      </div>

      {tab === 'videos' ? <VideoGenerator /> : <ImageGenerator />}
    </div>
  );
}
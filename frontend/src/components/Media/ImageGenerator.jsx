import { useState } from 'react';
import { Image, Download, Loader, RefreshCw } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import toast from 'react-hot-toast';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    'Diagram of database normalization (1NF, 2NF, 3NF)',
    'Binary search tree operations visualization',
    'OSI model layers diagram',
    'TCP three-way handshake illustration',
    'MVC architecture pattern diagram',
    'Stack and Queue data structure comparison'
  ];

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await mediaService.generateImage(prompt);
      setResult(data);
      toast.success('Image generated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageData) return;
    const a = document.createElement('a');
    a.href = result.imageData;
    a.download = `diagram-${prompt.slice(0, 30).replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl 
                        flex items-center justify-center">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Image Generator</h3>
            <p className="text-sm text-gray-500 dark:text-dark-200">
              Generate educational diagrams using Gemini AI
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateImage()}
            placeholder="Describe the diagram you need..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || loading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {loading
              ? <Loader className="w-5 h-5 animate-spin" />
              : <Image className="w-5 h-5" />}
            Generate
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setPrompt(s)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-dark-500 rounded-lg text-xs 
                         hover:bg-primary-50 dark:hover:bg-primary-900/20 
                         hover:text-primary-600 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center animate-fade-in">
          <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-dark-200">Generating your image with Gemini...</p>
          <p className="text-xs text-gray-400 mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {/* Result */}
      {result?.imageData && !loading && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold truncate max-w-[70%]">{result.prompt}</h4>
            <div className="flex gap-2">
              <button
                onClick={generateImage}
                className="btn-ghost flex items-center gap-2 text-sm"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={handleDownload}
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <img
            src={result.imageData}
            alt={result.prompt}
            className="w-full rounded-xl shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { imageGenerateService } from '../../services/imageGenerateService';
import {
    Sparkles, Image, Download, BookmarkPlus, BookmarkCheck,
    Loader, X, RefreshCw, ZoomIn, Wand2, Palette, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const STYLE_ICONS = {
    diagram: '📊', flowchart: '🔀', illustration: '🎨',
    infographic: '📈', realistic: '📷', cartoon: '🎭',
    sketch: '✏️', '3d': '🧊', minimal: '⚡', watercolor: '🖌️'
};

const SUGGESTIONS = [
    'Binary search tree data structure',
    'OSI model 7 layers network',
    'SQL joins Venn diagram',
    'MVC architecture pattern',
    'Object oriented programming concepts',
    'CPU scheduling algorithms comparison',
    'TCP three way handshake',
    'Linked list types visualization',
    'Database normalization process',
    'Stack and queue operations',
    'Merge sort algorithm steps',
    'Client server architecture'
];

export default function ImageGenerator() {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('');
    const [styles, setStyles] = useState([]);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState(1);
    const [savedImages, setSavedImages] = useState([]);
    const [showSaved, setShowSaved] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [savedUrls, setSavedUrls] = useState(new Set());

    useEffect(() => {
        loadStyles();
    }, []);

    const loadStyles = async () => {
        try {
            const data = await imageGenerateService.getStyles();
            setStyles(data);
        } catch {
            // Styles will use defaults
        }
    };

    const generateImage = async () => {
        if (!prompt.trim()) {
            toast.error('Enter a prompt to generate an image');
            return;
        }

        setLoading(true);
        setImageLoading(true);
        setGeneratedImage(null);

        try {
            const result = await imageGenerateService.generateImage({
                prompt,
                style: style || undefined,
                version
            });

            setGeneratedImage(result);
        } catch (error) {
            const msg = error.response?.data?.message || 'Generation failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const regenerate = async () => {
        const newVersion = version + 1;
        setVersion(newVersion);
        setImageLoading(true);
        setLoading(true);

        try {
            const result = await imageGenerateService.generateImage({
                prompt,
                style: style || undefined,
                version: newVersion
            });

            setGeneratedImage(result);
        } catch (error) {
            toast.error('Regeneration failed');
        } finally {
            setLoading(false);
        }
    };

    const saveImage = async () => {
        if (!generatedImage) return;

        try {
            await imageGenerateService.saveImage({
                imageUrl: generatedImage.imageUrl,
                prompt: generatedImage.prompt,
                style: generatedImage.style
            });
            setSavedUrls(prev => new Set([...prev, generatedImage.imageUrl]));
            toast.success('Image saved to collection!');
        } catch (error) {
            if (error.response?.status === 409) {
                toast('Already saved', { icon: '📌' });
            } else {
                toast.error('Failed to save');
            }
        }
    };

    const loadSavedImages = async () => {
        try {
            const data = await imageGenerateService.getSavedImages();
            setSavedImages(data);
            setShowSaved(true);
        } catch {
            toast.error('Failed to load saved images');
        }
    };

    const deleteSaved = async (id) => {
        try {
            await imageGenerateService.deleteSavedImage(id);
            setSavedImages(prev => prev.filter(i => i.id !== id));
            toast.success('Removed');
        } catch {
            toast.error('Failed to remove');
        }
    };

    const downloadImage = (url, name) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = `${name || 'ai-generated'}.jpg`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Generation Card */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl
                        flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">AI Image Generator</h3>
                        <p className="text-sm text-gray-500 dark:text-dark-200">
                            Generate educational images from text prompts
                        </p>
                    </div>
                </div>

                {/* Prompt Input */}
                <div className="mb-4">
                    <div className="relative">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => { setPrompt(e.target.value); setVersion(1); }}
                            onKeyDown={(e) => e.key === 'Enter' && generateImage()}
                            placeholder="Describe the image you want to generate..."
                            className="input-field pl-12 text-base"
                        />
                    </div>
                </div>

                {/* Style Selector */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Style</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setStyle('')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                         whitespace-nowrap transition-all
                ${!style
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                                }`}
                        >
                            <span>🎯</span>
                            <span>Default</span>
                        </button>
                        {styles.map(s => (
                            <button
                                key={s.key}
                                onClick={() => setStyle(s.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                           whitespace-nowrap transition-all
                  ${style === s.key
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
                                    }`}
                            >
                                <span>{STYLE_ICONS[s.key] || '🎨'}</span>
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Suggestions */}
                <div className="mb-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Suggestions</span>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => { setPrompt(s); setVersion(1); }}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-dark-500 rounded-lg text-xs
                         hover:bg-purple-50 dark:hover:bg-purple-900/20 
                         hover:text-purple-600 transition-all"
                            >
                                ✨ {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button + Saved */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-400">
                    <button
                        onClick={loadSavedImages}
                        className="btn-ghost flex items-center gap-2 text-sm"
                    >
                        <BookmarkCheck className="w-4 h-4" />
                        My Gallery
                    </button>

                    <button
                        onClick={generateImage}
                        disabled={loading || !prompt.trim()}
                        className="btn-primary px-8 bg-gradient-to-r from-violet-600 to-purple-600 
                     hover:from-violet-700 hover:to-purple-700 flex items-center gap-2"
                    >
                        {loading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Wand2 className="w-5 h-5" />
                        )}
                        Generate
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && !generatedImage && (
                <div className="card p-12 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-500 animate-pulse" />
                    </div>
                    <p className="text-gray-500 font-medium">Generating your image...</p>
                    <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
                </div>
            )}

            {/* Generated Result */}
            {generatedImage && (
                <div className="card overflow-hidden">
                    {/* Image Display */}
                    <div className="relative bg-gray-100 dark:bg-dark-800 min-h-[300px] flex items-center justify-center">
                        {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/80 dark:bg-dark-800/80">
                                <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                            </div>
                        )}
                        <img
                            src={generatedImage.imageUrl}
                            alt={generatedImage.prompt}
                            className="max-w-full max-h-[500px] object-contain cursor-pointer"
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                                setImageLoading(false);
                                toast.error('Image generation failed. Try a different prompt.');
                            }}
                            onClick={() => setShowPreview(true)}
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="p-5">
                        <p className="text-sm text-gray-600 dark:text-dark-200 mb-1">
                            <span className="font-semibold text-gray-800 dark:text-white">Prompt:</span> {generatedImage.prompt}
                        </p>
                        {generatedImage.style && generatedImage.style !== 'default' && (
                            <p className="text-xs text-gray-400 mb-3">
                                Style: {STYLE_ICONS[generatedImage.style] || ''} {generatedImage.style}
                            </p>
                        )}

                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={regenerate}
                                disabled={loading}
                                className="btn-secondary flex items-center gap-2"
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Regenerate
                            </button>

                            <button
                                onClick={saveImage}
                                className={`btn-primary flex items-center gap-2 ${savedUrls.has(generatedImage.imageUrl)
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gradient-to-r from-violet-600 to-purple-600'
                                    }`}
                            >
                                {savedUrls.has(generatedImage.imageUrl)
                                    ? <><BookmarkCheck className="w-4 h-4" /> Saved</>
                                    : <><BookmarkPlus className="w-4 h-4" /> Save</>
                                }
                            </button>

                            <button
                                onClick={() => downloadImage(generatedImage.imageUrl, generatedImage.prompt)}
                                className="btn-ghost flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !generatedImage && (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 
                        dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl 
                        flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Generate AI Images</h3>
                    <p className="text-sm text-gray-500">
                        Describe what you want and AI will create it for you
                    </p>
                </div>
            )}

            {/* Fullscreen Preview Modal */}
            {showPreview && generatedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <img
                        src={generatedImage.imageUrl}
                        alt={generatedImage.prompt}
                        className="max-w-full max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setShowPreview(false)}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 
                     text-white rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Saved Images Modal */}
            {showSaved && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSaved(false)}
                >
                    <div
                        className="bg-white dark:bg-dark-600 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-400">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                My Generated Images ({savedImages.length})
                            </h3>
                            <button onClick={() => setShowSaved(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh] p-5">
                            {savedImages.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No saved images yet</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {savedImages.map(img => (
                                        <div key={img.id} className="relative group rounded-xl overflow-hidden border
                                                border-gray-200 dark:border-dark-400">
                                            <img
                                                src={img.imageUrl}
                                                alt={img.prompt}
                                                className="w-full h-40 object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 
                                    transition-all flex flex-col items-center justify-center gap-2">
                                                <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                                    <button
                                                        onClick={() => downloadImage(img.imageUrl, img.prompt)}
                                                        className="p-2 bg-white/90 rounded-lg hover:bg-white"
                                                    >
                                                        <Download className="w-4 h-4 text-gray-700" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSaved(img.id)}
                                                        className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 text-white"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <p className="text-xs truncate font-medium">{img.prompt}</p>
                                                {img.style && (
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {STYLE_ICONS[img.style] || ''} {img.style}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

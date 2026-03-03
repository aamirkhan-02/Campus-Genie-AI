import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

/**
 * Given a crop area (pixels), returns a canvas-cropped blob.
 */
async function getCroppedImg(imageSrc, crop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, crop.width, crop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            0.92
        );
    });
}

function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (e) => reject(e));
        img.crossOrigin = 'anonymous';
        img.src = url;
    });
}

export default function CropModal({ imageSrc, onCropDone, onClose }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [saving, setSaving] = useState(false);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setSaving(true);
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropDone(blob);
        } catch (err) {
            console.error('Crop failed:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-dark-700 rounded-2xl 
                      shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-500">
                    <h3 className="text-lg font-bold">Crop Profile Picture</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cropper */}
                <div className="relative w-full h-80 bg-dark-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                {/* Controls */}
                <div className="px-5 py-4 space-y-3">
                    {/* Zoom */}
                    <div className="flex items-center gap-3">
                        <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-500 rounded-full appearance-none 
                       cursor-pointer accent-primary-500"
                        />
                        <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* Rotate */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 
                       hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg transition-colors"
                        >
                            <RotateCw className="w-4 h-4" />
                            Rotate
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-dark-500">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-dark-400
                     hover:bg-gray-50 dark:hover:bg-dark-600 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 
                     text-white font-medium hover:opacity-90 transition-opacity
                     flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Apply
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

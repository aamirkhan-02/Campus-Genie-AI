const pool = require('../config/db');
const crypto = require('crypto');

// ============================================
// IMAGE STYLES for educational content
// ============================================
const IMAGE_STYLES = {
    diagram: { label: 'Diagram', hint: 'technical diagram illustration clean labeled' },
    flowchart: { label: 'Flowchart', hint: 'flowchart process steps arrows clean' },
    illustration: { label: 'Illustration', hint: 'educational illustration colorful detailed' },
    infographic: { label: 'Infographic', hint: 'infographic visual summary data' },
    realistic: { label: 'Realistic', hint: 'photorealistic high quality detailed' },
    cartoon: { label: 'Cartoon', hint: 'cartoon style colorful fun illustration' },
    sketch: { label: 'Sketch', hint: 'pencil sketch hand drawn style' },
    '3d': { label: '3D Render', hint: '3D render modern glossy high quality' },
    minimal: { label: 'Minimal', hint: 'minimalist clean simple design' },
    watercolor: { label: 'Watercolor', hint: 'watercolor painting artistic soft colors' }
};

// ============================================
// GENERATE IMAGE via ImageKit
// ============================================
exports.generateImage = async (req, res, next) => {
    try {
        const { prompt, style, version } = req.query;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
        if (!urlEndpoint) {
            return res.status(503).json({
                success: false,
                message: 'ImageKit not configured. Add IMAGEKIT_URL_ENDPOINT to .env'
            });
        }

        // Build the full prompt with style hints
        let fullPrompt = prompt.trim();
        if (style && IMAGE_STYLES[style]) {
            fullPrompt = `${fullPrompt} ${IMAGE_STYLES[style].hint}`;
        }

        // Create a unique filename based on prompt
        const hash = crypto.createHash('md5').update(fullPrompt).digest('hex').substring(0, 10);
        const ver = parseInt(version) || 1;
        const filename = `gen-${hash}.jpg`;
        const filepath = `ai-generated/${filename}`;

        // Construct ImageKit generation URL
        // Format: {URL_ENDPOINT}/ik-genimg-prompt-{text}/filepath
        const encodedPrompt = encodeURIComponent(fullPrompt);
        let imageUrl = `${urlEndpoint}/ik-genimg-prompt-${encodedPrompt}/${filepath}`;

        // Add version parameter for regeneration
        if (ver > 1) {
            imageUrl += `?v=${ver}`;
        }

        // Save search to study stats
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
            `INSERT INTO study_stats (user_id, subject_name, questions_asked, session_date)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE questions_asked = questions_asked + 1`,
            [req.user.id, 'AI Image Generation', today]
        ).catch(() => { });

        res.json({
            success: true,
            data: {
                imageUrl,
                prompt: fullPrompt,
                style: style || 'default',
                version: ver,
                filename
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET AVAILABLE STYLES
// ============================================
exports.getStyles = async (req, res) => {
    const styles = Object.entries(IMAGE_STYLES).map(([key, value]) => ({
        key,
        label: value.label
    }));

    res.json({ success: true, data: styles });
};

// ============================================
// SAVE GENERATED IMAGE
// ============================================
exports.saveImage = async (req, res, next) => {
    try {
        const { imageUrl, prompt, style } = req.body;

        if (!imageUrl || !prompt) {
            return res.status(400).json({
                success: false,
                message: 'imageUrl and prompt are required'
            });
        }

        // Check duplicate
        const [existing] = await pool.query(
            "SELECT id FROM generated_media WHERE user_id = ? AND media_type = 'ai_image' AND url = ?",
            [req.user.id, imageUrl]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Image already saved'
            });
        }

        await pool.query(
            `INSERT INTO generated_media (user_id, media_type, prompt, url, file_path, status)
       VALUES (?, 'ai_image', ?, ?, ?, 'completed')`,
            [
                req.user.id,
                JSON.stringify({ prompt, style }),
                imageUrl,
                imageUrl
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Image saved to your collection'
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET SAVED GENERATED IMAGES
// ============================================
exports.getSavedImages = async (req, res, next) => {
    try {
        let query = "SELECT * FROM generated_media WHERE user_id = ? AND media_type = 'ai_image' AND status = 'completed'";
        const params = [req.user.id];
        query += ' ORDER BY created_at DESC';

        const [images] = await pool.query(query, params);

        const formatted = images.map(img => {
            let meta = {};
            try { meta = JSON.parse(img.prompt); } catch { }
            return {
                id: img.id,
                prompt: meta.prompt || 'Generated Image',
                style: meta.style || '',
                imageUrl: img.url,
                savedAt: img.created_at
            };
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

// ============================================
// DELETE SAVED IMAGE
// ============================================
exports.deleteSavedImage = async (req, res, next) => {
    try {
        await pool.query(
            "DELETE FROM generated_media WHERE id = ? AND user_id = ? AND media_type = 'ai_image'",
            [req.params.id, req.user.id]
        );
        res.json({ success: true, message: 'Image removed' });
    } catch (error) {
        next(error);
    }
};

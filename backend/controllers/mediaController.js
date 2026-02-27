const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate image using Gemini image generation model
exports.generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Save media record
    const [record] = await pool.query(
      `INSERT INTO generated_media (user_id, media_type, prompt, status) 
       VALUES (?, 'image', ?, 'pending')`,
      [req.user.id, prompt]
    );

    try {
      // Use Gemini's image generation model
      const imageModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp-image-generation'
      });

      const enhancedPrompt = `Educational diagram: ${prompt}. 
        Style: Clean, professional, educational illustration with clear labels. 
        White background, clear colors, suitable for studying and exam preparation.`;

      const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          responseModalities: ['image']
        }
      });

      // Extract base64 image from response
      const parts = result.response.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart) {
        throw new Error('No image returned from Gemini');
      }

      const { data: base64, mimeType } = imagePart.inlineData;
      const dataUrl = `data:${mimeType};base64,${base64}`;

      await pool.query(
        'UPDATE generated_media SET status = ?, url = ? WHERE id = ?',
        ['completed', 'gemini-image', record.insertId]
      );

      res.json({
        success: true,
        data: {
          id: record.insertId,
          imageData: dataUrl,
          mimeType,
          prompt
        }
      });
    } catch (aiError) {
      await pool.query(
        'UPDATE generated_media SET status = ? WHERE id = ?',
        ['failed', record.insertId]
      );
      throw aiError;
    }
  } catch (error) {
    next(error);
  }
};

// Generate video storyboard using Gemini
exports.generateVideo = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const [record] = await pool.query(
      `INSERT INTO generated_media (user_id, media_type, prompt, status) 
       VALUES (?, 'video', ?, 'pending')`,
      [req.user.id, prompt]
    );

    const result = await gemini.generateContent(
      `Create a detailed storyboard/script for a 1-minute educational animation about: "${prompt}".
       Include: Scene descriptions, narration text, visual elements, and timing.
       Format it as a structured storyboard with timestamps.`
    );

    const storyboard = result.response.text();

    await pool.query(
      'UPDATE generated_media SET status = ?, url = ? WHERE id = ?',
      ['completed', 'storyboard', record.insertId]
    );

    res.json({
      success: true,
      data: {
        id: record.insertId,
        type: 'storyboard',
        content: storyboard,
        message: 'Video storyboard generated via Gemini.',
        prompt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Text to Speech prep — clean text using Gemini
exports.textToSpeech = async (req, res, next) => {
  try {
    const { text } = req.body;

    const result = await gemini.generateContent(
      `Convert the following text into a natural speech-friendly format. 
       Remove markdown, code blocks, and special formatting. 
       Keep it conversational and easy to listen to.\n\n${text}`
    );

    res.json({
      success: true,
      data: {
        speech_text: result.response.text()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's generated media
exports.getMedia = async (req, res, next) => {
  try {
    const [media] = await pool.query(
      'SELECT * FROM generated_media WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
};
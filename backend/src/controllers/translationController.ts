import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbRun, dbAll } from '../db/schema';
import { AIService } from '../services/aiService';

export const createTranslation = async (req: Request, res: Response): Promise<void> => {
  const { id: episodeId } = req.params;
  const { language } = req.body;

  try {
    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      res.status(404).json({ error: 'Episode not found' });
      return;
    }

    // Check if translation already exists
    const existing = await dbGet('SELECT * FROM translations WHERE episode_id = ? AND language = ?', [episodeId, language]);
    if (existing) {
      res.status(400).json({ error: 'Translation already exists for this language' });
      return;
    }

    const translationId = uuidv4();
    await dbRun(
      'INSERT INTO translations (id, episode_id, language, translated_content, status) VALUES (?, ?, ?, ?, ?)',
      [translationId, episodeId, language, '', 'translating']
    );

    res.json({ id: translationId, status: 'translating', language });

    // Run AI task in background
    setTimeout(async () => {
      try {
        const result = await AIService.runLocalization({ content: episode.content, language }, translationId);
        await dbRun(
          'UPDATE translations SET translated_content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [result.translated_content, 'needs_review', translationId]
        );
      } catch (e) {
        console.error('Background translation failed', e);
        // Error handling could update status to 'failed' if we had one
      }
    }, 0);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create translation' });
  }
};

export const getTranslations = async (req: Request, res: Response): Promise<void> => {
  const { id: episodeId } = req.params;
  try {
    const translations = await dbAll('SELECT * FROM translations WHERE episode_id = ? ORDER BY created_at DESC', [episodeId]);
    
    for (let t of translations) {
      if (typeof t.localization_notes === 'string') {
        try {
          t.localization_notes = JSON.parse(t.localization_notes);
        } catch(e) {}
      }
      const audio = await dbGet('SELECT * FROM translation_audio WHERE translation_id = ? ORDER BY created_at DESC LIMIT 1', [t.id]);
      t.audio = audio || null;
    }

    res.json(translations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
};

export const updateTranslation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { translated_content, status, localization_notes } = req.body;

  try {
    let query = 'UPDATE translations SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];

    if (translated_content !== undefined) {
      query += ', translated_content = ?';
      params.push(translated_content);
    }
    if (status !== undefined) {
      query += ', status = ?';
      params.push(status);
    }
    if (localization_notes !== undefined) {
      query += ', localization_notes = ?';
      params.push(localization_notes);
    }
    query += ' WHERE id = ?';
    params.push(id);

    await dbRun(query, params);
    const updated = await dbGet('SELECT * FROM translations WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update translation' });
  }
};

export const runQAPass = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const translation = await dbGet('SELECT * FROM translations WHERE id = ?', [id]);
    if (!translation) {
      res.status(404).json({ error: 'Translation not found' });
      return;
    }

    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [translation.episode_id]);
    
    // Quick respond
    res.json({ status: 'running_qa' });

    setTimeout(async () => {
      try {
        const issues = await AIService.runLocalizationQA(
          { originalContent: episode.content, translatedContent: translation.translated_content, language: translation.language },
          `qa-${id}`
        );
        await dbRun('UPDATE translations SET localization_notes = ? WHERE id = ?', [JSON.stringify(issues), id]);
      } catch (err) {
        console.error('QA pass failed', err);
      }
    }, 0);
  } catch (err) {
    res.status(500).json({ error: 'Failed to run QA' });
  }
};

export const generateAudio = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const translation = await dbGet('SELECT * FROM translations WHERE id = ?', [id]);
    if (!translation) {
      res.status(404).json({ error: 'Translation not found' });
      return;
    }

    // Import AudioService dynamically to avoid circular dependencies if any
    const { AudioService } = await import('../services/audioService');
    const audioId = uuidv4();

    await dbRun(
      'INSERT INTO translation_audio (id, translation_id, audio_url, duration_seconds, status) VALUES (?, ?, ?, ?, ?)',
      [audioId, id, '', 0, 'generating']
    );

    res.json({ status: 'generating_audio', audio_id: audioId });

    setTimeout(async () => {
      try {
        await AudioService.generateTranslationAudio(id, translation.translated_content, translation.language);
      } catch (err) {
        console.error('Audio generation failed', err);
      }
    }, 0);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start audio generation' });
  }
};

export const publishTranslation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const translation = await dbGet('SELECT * FROM translations WHERE id = ?', [id]);
    if (!translation) {
      res.status(404).json({ error: 'Translation not found' });
      return;
    }

    await dbRun('UPDATE translations SET status = ? WHERE id = ?', ['published', id]);
    
    // Also publish the audio if it exists
    await dbRun('UPDATE translation_audio SET status = ? WHERE translation_id = ?', ['published', id]);

    res.json({ message: 'Translation published successfully' });
  } catch (err) {
    console.error('Failed to publish translation', err);
    res.status(500).json({ error: 'Failed to publish translation' });
  }
};

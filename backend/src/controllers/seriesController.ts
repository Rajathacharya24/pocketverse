import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '../db/schema';

export async function createSeries(req: Request, res: Response) {
  try {
    const { title, target_languages } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Series title is required.' });
    }

    const id = uuidv4();
    const creatorId = 'creator-default'; // Single unified creator permission model
    const targetLangsStr = Array.isArray(target_languages) ? JSON.stringify(target_languages) : '[]';

    await dbRun(
      'INSERT INTO series (id, title, target_languages, creator_id) VALUES (?, ?, ?, ?)',
      [id, title.trim(), targetLangsStr, creatorId]
    );

    const series = await dbGet('SELECT * FROM series WHERE id = ?', [id]);
    return res.status(201).json(series);
  } catch (err: any) {
    console.error('Error in createSeries:', err);
    return res.status(500).json({ error: 'Failed to create series' });
  }
}

export async function getAllSeries(req: Request, res: Response) {
  try {
    const seriesList = await dbAll('SELECT * FROM series ORDER BY created_at DESC');
    
    // Attach episode count and parse target_languages
    for (const s of seriesList) {
      const countRes = await dbGet<{ count: number }>(
        'SELECT COUNT(*) as count FROM episodes WHERE series_id = ?',
        [s.id]
      );
      s.episode_count = countRes ? countRes.count : 0;
      
      try {
        s.target_languages = typeof s.target_languages === 'string' 
          ? JSON.parse(s.target_languages) 
          : (s.target_languages || []);
      } catch (e) {
        s.target_languages = [];
      }
    }

    return res.json(seriesList);
  } catch (err: any) {
    console.error('Error in getAllSeries:', err);
    return res.status(500).json({ error: 'Failed to fetch series list' });
  }
}

export async function getSeriesById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const series = await dbGet('SELECT * FROM series WHERE id = ?', [id]);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    try {
      series.target_languages = typeof series.target_languages === 'string' 
        ? JSON.parse(series.target_languages) 
        : (series.target_languages || []);
    } catch (e) {
      series.target_languages = [];
    }

    const episodes = await dbAll(
      'SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC',
      [id]
    );

    // Fetch translations for all episodes
    for (const ep of episodes) {
      const translations = await dbAll('SELECT * FROM translations WHERE episode_id = ?', [ep.id]);
      
      for (let t of translations) {
        if (typeof t.localization_notes === 'string') {
          try {
            t.localization_notes = JSON.parse(t.localization_notes);
          } catch(e) {}
        }
        const audio = await dbGet('SELECT * FROM translation_audio WHERE translation_id = ? ORDER BY created_at DESC LIMIT 1', [t.id]);
        t.audio = audio || null;
      }
      ep.translations = translations;
    }


    return res.json({
      ...series,
      episodes,
    });
  } catch (err: any) {
    console.error('Error in getSeriesById:', err);
    return res.status(500).json({ error: 'Failed to fetch series' });
  }
}

export async function updateSeries(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { target_languages } = req.body;
    
    if (target_languages !== undefined) {
      const targetLangsStr = Array.isArray(target_languages) ? JSON.stringify(target_languages) : '[]';
      await dbRun('UPDATE series SET target_languages = ? WHERE id = ?', [targetLangsStr, id]);
    }
    
    const series = await dbGet('SELECT * FROM series WHERE id = ?', [id]);
    return res.json(series);
  } catch (err: any) {
    console.error('Error in updateSeries:', err);
    return res.status(500).json({ error: 'Failed to update series' });
  }
}

export async function deleteSeries(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const series = await dbGet('SELECT * FROM series WHERE id = ?', [id]);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    // ON DELETE CASCADE will handle episodes, analysis_runs, translations etc.
    await dbRun('DELETE FROM series WHERE id = ?', [id]);
    
    return res.json({ message: 'Series deleted successfully' });
  } catch (err: any) {
    console.error('Error in deleteSeries:', err);
    return res.status(500).json({ error: 'Failed to delete series' });
  }
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDb } from './db/schema';
import { progressService } from './services/progressService';

// Import Controllers
import * as SeriesController from './controllers/seriesController';
import * as EpisodeController from './controllers/episodeController';
import * as AnalysisController from './controllers/analysisController';
import { AudioController } from './controllers/audioController';
import * as TranslationController from './controllers/translationController';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve generated audio static files from public/audio
const publicAudioDir = path.join(__dirname, '../public/audio');
app.use('/audio', express.static(publicAudioDir));

// --- API ROUTES ---

// 0. Real-time Telemetry & Progress API Endpoint
app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const progress = progressService.getProgress(jobId);
  res.json(progress);
});

// 1. Series Routes
app.get('/api/series', SeriesController.getAllSeries);
app.post('/api/series', SeriesController.createSeries);
app.get('/api/series/:id', SeriesController.getSeriesById);
app.put('/api/series/:id', SeriesController.updateSeries);
app.delete('/api/series/:id', SeriesController.deleteSeries);

// 2. Episode Routes
app.post('/api/series/:seriesId/episodes', EpisodeController.createEpisode);
app.get('/api/episodes/:id', EpisodeController.getEpisodeById);
app.put('/api/episodes/:id', EpisodeController.updateEpisode);
app.delete('/api/episodes/:id', EpisodeController.deleteEpisode);

// 3. Analysis Pipeline Routes
app.post('/api/episodes/:id/analysis/continuity', AnalysisController.runContinuity);
app.post('/api/episodes/:id/analysis/grammar', AnalysisController.runGrammar);
app.post('/api/episodes/:id/analysis/tone', AnalysisController.runToneRemix);
app.post('/api/episodes/:id/analysis/save', AnalysisController.saveAnalysis);

// 4. Audio Production Pipeline Routes
app.post('/api/episodes/:id/audio/direction', AudioController.getDirection);
app.post('/api/episodes/:id/audio/generate', AudioController.generate);
app.get('/api/episodes/:id/audio', AudioController.getAudioStatus);
app.post('/api/episodes/:id/audio/publish', AudioController.publish);

// 5. Translation & Localization Routes
app.get('/api/episodes/:id/translations', TranslationController.getTranslations);
app.post('/api/episodes/:id/translations', TranslationController.createTranslation);
app.put('/api/translations/:id', TranslationController.updateTranslation);
app.post('/api/translations/:id/qa', TranslationController.runQAPass);
app.post('/api/translations/:id/audio/generate', TranslationController.generateAudio);
app.post('/api/translations/:id/publish', TranslationController.publishTranslation);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB and start server
initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚡ PocketVerse Backend Server running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getAllAudioBase64 } from 'google-tts-api';
import ffmpegPath from 'ffmpeg-static';
import { dbGet, dbRun } from '../db/schema';
import { progressService } from './progressService';

const execAsync = promisify(exec);

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface PacingNote {
  text_span: string;
  pause_ms: number;
  emphasis?: 'none' | 'moderate' | 'strong';
}

export interface SoundCue {
  paragraph_index: number;
  location_setting: string;
  ambient_soundscape: string;
  foley_effects: string[];
  mood_tag: string;
}

export interface PerformanceBrief {
  voice_id: string;
  voice_name?: string;
  voice_settings: VoiceSettings;
  pacing_notes: PacingNote[];
  soundscape_cues?: SoundCue[];
  ambience_description: string;
  ambience_volume_db: number;
}

export interface AudioRenderRecord {
  id: string;
  episode_id: string;
  performance_brief: PerformanceBrief;
  voice_id: string;
  audio_url: string;
  duration_seconds: number;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
}

const PUBLIC_AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
  fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
}

function getOpenAIClient(): OpenAI | null {
  const backendEnvPath = path.join(__dirname, '../../.env');
  const rootEnvPath = path.join(process.cwd(), '.env');
  const cwdBackendEnvPath = path.join(process.cwd(), 'backend/.env');

  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath, override: true });
  } else if (fs.existsSync(cwdBackendEnvPath)) {
    dotenv.config({ path: cwdBackendEnvPath, override: true });
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath, override: true });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.length > 20) {
    return new OpenAI({ apiKey });
  }
  return null;
}

export class AudioService {
  /**
   * Select best OpenAI Male Voice based on story genre & tone
   */
  static selectBestMaleOpenAIVoice(toneCategory: string): { voice: 'onyx' | 'echo' | 'fable' | 'alloy'; name: string } {
    const cat = (toneCategory || '').toLowerCase();
    if (cat.includes('horror') || cat.includes('dark') || cat.includes('mystery') || cat.includes('noir')) {
      return { voice: 'onyx', name: 'Onyx Deep Authoritative Male Baritone' };
    }
    if (cat.includes('cyberpunk') || cat.includes('sci-fi') || cat.includes('drama') || cat.includes('thriller')) {
      return { voice: 'echo', name: 'Echo Resonant Cinematic Male Storyteller' };
    }
    if (cat.includes('comedy') || cat.includes('funny') || cat.includes('adventure')) {
      return { voice: 'fable', name: 'Fable Expressive Dynamic Male Storyteller' };
    }
    return { voice: 'onyx', name: 'Onyx Deep Authoritative Male Baritone' };
  }

  /**
   * PHASE 2: Generate Audio Performance Brief & Foley Soundscape Cues using Technical Audio Director Persona
   */
  static async generatePerformanceBrief(episode: { id: string; title: string; content: string }, toneCategory: string): Promise<PerformanceBrief> {
    const jobId = episode.id;
    const openai = getOpenAIClient();
    const voiceSelection = AudioService.selectBestMaleOpenAIVoice(toneCategory);
    const category = (toneCategory || 'Drama').toLowerCase();

    progressService.resetProgress(jobId);
    progressService.updateProgress(jobId, 15, '🎧 Generating Foley Soundscape Cues & Audio Brief...', `[AudioService] 🎧 Analyzing soundscape cues for "${episode.title}" (${toneCategory})...`, 'GPT-4o');

    let defaultAmbience = 'Natural wind breeze whispering through dark trees with subtle ambient warmth';
    let defaultVolumeDb = -18;
    let defaultSettings: VoiceSettings = { stability: 0.45, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true };

    if (category.includes('horror')) {
      defaultAmbience = 'Eerie wind breeze howling gently through old ruins with subtle banyan tree creaks';
      defaultVolumeDb = -18;
      defaultSettings = { stability: 0.35, similarity_boost: 0.90, style: 0.75, use_speaker_boost: true };
    } else if (category.includes('cyberpunk') || category.includes('sci-fi')) {
      defaultAmbience = 'Low frequency sub-bass hum with digital static, vehicle sirens, and neon glare drones';
      defaultVolumeDb = -16;
      defaultSettings = { stability: 0.60, similarity_boost: 0.80, style: 0.40, use_speaker_boost: true };
    } else if (category.includes('funny') || category.includes('comedy')) {
      defaultAmbience = 'Light upbeat acoustic rhythm with subtle comedic room tones';
      defaultVolumeDb = -20;
      defaultSettings = { stability: 0.50, similarity_boost: 0.75, style: 0.65, use_speaker_boost: true };
    } else if (category.includes('noir')) {
      defaultAmbience = 'Midnight neon pavement rain with city traffic hum and foghorns in the bay';
      defaultVolumeDb = -18;
      defaultSettings = { stability: 0.40, similarity_boost: 0.88, style: 0.60, use_speaker_boost: true };
    }

    // Paragraph-based Foley & Soundscape breakdown fallback
    const paragraphs = episode.content.split(/\n+/).filter(p => p.trim());
    const defaultSoundCues: SoundCue[] = paragraphs.map((p, idx) => {
      let setting = 'General Scene Environment';
      let ambient = defaultAmbience;
      let foley = ['Subtle Room Ambience', 'Character Footsteps'];
      let mood = toneCategory;

      if (category.includes('horror') || p.toLowerCase().includes('cremation') || p.toLowerCase().includes('ghost') || p.toLowerCase().includes('vikrama')) {
        setting = 'Haunted Cremation Ground at Midnight';
        ambient = 'Eerie wind breezing through bare trees with distant dog barking and crackling dry leaves';
        foley = ['🐕 Distant Dog Barking', '💨 Eerie Wind Breeze', '🦉 Spectral Owl Hoot', '🪵 Creaking Banyan Tree'];
        mood = 'Foreboding Horror';
      } else if (p.toLowerCase().includes('robber') || p.toLowerCase().includes('forest') || p.toLowerCase().includes('attack')) {
        setting = 'Dense Dark Forest Path';
        ambient = 'Chilling forest rustle with wind gusting through thick canopy';
        foley = ['🗡️ Blade Clashing', '👣 Heavy Running Footsteps', '⚡ Thunder Crackle'];
        mood = 'High Tension Drama';
      } else if (category.includes('cyberpunk') || category.includes('sci-fi') || p.toLowerCase().includes('city') || p.toLowerCase().includes('neon')) {
        setting = 'Rain-Slicked Neon City District';
        ambient = 'Heavy city traffic hum with distant vehicle sirens and rain patter on metal pavement';
        foley = ['🚗 Distant Vehicle Sirens', '🌧️ Rain Patter on Metal', '⚡ Electric Neon Buzz'];
        mood = 'Tech-Noir Thriller';
      }

      return {
        paragraph_index: idx + 1,
        location_setting: setting,
        ambient_soundscape: ambient,
        foley_effects: foley,
        mood_tag: mood,
      };
    });

    const sentences = episode.content.split(/(?<=[.!?])\s+/).filter(Boolean);
    const defaultPacingNotes: PacingNote[] = sentences.slice(0, 8).map((s, idx) => ({
      text_span: s.substring(0, 60),
      pause_ms: idx === sentences.length - 1 ? 1500 : 800,
      emphasis: idx % 2 === 0 ? 'strong' : 'moderate',
    }));

    if (openai) {
      console.log(`[AudioService] 🎧 Generating Soundscape Cues & Male Voice Brief (${voiceSelection.name}) for Episode: "${episode.title}" (${toneCategory} tone)...`);
      try {
        const prompt = `
You are a Technical Audio Director. Analyze script "${episode.title}" in tone "${toneCategory}".
Create brief JSON with soundscape_cues and pacing_notes. Voice model: "${voiceSelection.voice}" (${voiceSelection.name}).
Script:
"""
${episode.content.substring(0, 3000)}
"""

Return JSON:
{
  "voice_id": "${voiceSelection.voice}",
  "voice_name": "${voiceSelection.name}",
  "voice_settings": { "stability": 0.45, "similarity_boost": 0.85, "style": 0.60, "use_speaker_boost": true },
  "pacing_notes": [{ "text_span": "Opening span", "pause_ms": 1000, "emphasis": "strong" }],
  "soundscape_cues": [{ "paragraph_index": 1, "location_setting": "Scene Setting", "ambient_soundscape": "Sound bed", "foley_effects": ["💨 Wind Breeze"], "mood_tag": "${toneCategory}" }],
  "ambience_description": "Overall sound bed",
  "ambience_volume_db": -18
}
`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a technical audio director. Respond strictly in JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        progressService.updateProgress(jobId, 30, '🎧 Audio Performance Brief Prepared', `[AudioService] Voice selected: ${parsed.voice_name || voiceSelection.name}`, 'GPT-4o');

        return {
          voice_id: parsed.voice_id || voiceSelection.voice,
          voice_name: parsed.voice_name || voiceSelection.name,
          voice_settings: {
            stability: typeof parsed.voice_settings?.stability === 'number' ? parsed.voice_settings.stability : defaultSettings.stability,
            similarity_boost: typeof parsed.voice_settings?.similarity_boost === 'number' ? parsed.voice_settings.similarity_boost : defaultSettings.similarity_boost,
            style: typeof parsed.voice_settings?.style === 'number' ? parsed.voice_settings.style : defaultSettings.style,
            use_speaker_boost: typeof parsed.voice_settings?.use_speaker_boost === 'boolean' ? parsed.voice_settings.use_speaker_boost : defaultSettings.use_speaker_boost,
          },
          pacing_notes: Array.isArray(parsed.pacing_notes) && parsed.pacing_notes.length > 0 ? parsed.pacing_notes : defaultPacingNotes,
          soundscape_cues: Array.isArray(parsed.soundscape_cues) && parsed.soundscape_cues.length > 0 ? parsed.soundscape_cues : defaultSoundCues,
          ambience_description: parsed.ambience_description || defaultAmbience,
          ambience_volume_db: typeof parsed.ambience_volume_db === 'number' ? parsed.ambience_volume_db : defaultVolumeDb,
        };
      } catch (err: any) {
        console.error('[AudioService] LLM Performance Brief Error:', err?.message || err);
      }
    }

    progressService.updateProgress(jobId, 30, '🎧 Audio Performance Brief Prepared', `[AudioService] Voice selected: ${voiceSelection.name}`, 'Audio Engine');

    return {
      voice_id: voiceSelection.voice,
      voice_name: voiceSelection.name,
      voice_settings: defaultSettings,
      pacing_notes: defaultPacingNotes,
      soundscape_cues: defaultSoundCues,
      ambience_description: defaultAmbience,
      ambience_volume_db: defaultVolumeDb,
    };
  }

  /**
   * PHASE 1 - 4: Render Full Episode Audio (High-Speed Concurrency parallel OpenAI TTS + Soundscape)
   */
  static async renderAudio(episodeId: string, brief: PerformanceBrief): Promise<AudioRenderRecord> {
    const renderId = uuidv4();
    const jobId = episodeId;

    progressService.resetProgress(jobId);
    progressService.updateProgress(jobId, 10, '🎙️ Initializing Parallel Audio Synthesis Pipeline...', `[AudioService] ⚡ Starting Audio Render for Episode ID: ${episodeId}`, 'OpenAI TTS');

    // 1. Fetch Episode text
    const episode = await dbGet<any>('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    await dbRun('UPDATE episodes SET audio_status = "generating", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [episodeId]);

    await dbRun(`
      INSERT INTO audio_renders (id, episode_id, performance_brief, voice_id, audio_url, duration_seconds, status)
      VALUES (?, ?, ?, ?, ?, ?, 'generating')
    `, [renderId, episodeId, JSON.stringify(brief), brief.voice_id, '', 0]);

    const filename = `render-${renderId}.mp3`;
    const outputPath = path.join(PUBLIC_AUDIO_DIR, filename);
    const audioUrl = `/audio/${filename}`;

    try {
      const openai = getOpenAIClient();
      let narrationPath = path.join(PUBLIC_AUDIO_DIR, `narration-${renderId}.mp3`);
      let ambiencePath = path.join(PUBLIC_AUDIO_DIR, `ambience-${renderId}.wav`);

      const wordCount = episode.content.trim().split(/\s+/).filter(Boolean).length;
      const estimatedNarrationDuration = Math.max(15, Math.ceil(wordCount / 2.2));
      let ttsSuccess = false;

      // 1. HIGH-SPEED CONCURRENCY TASK: Parallelize OpenAI Speech Chunking & Wind Soundscape Generation simultaneously!
      const generateSpeechPromise = (async () => {
        if (!openai) return false;
        const maleVoice = (brief.voice_id === 'echo' || brief.voice_id === 'fable' || brief.voice_id === 'alloy') ? brief.voice_id : 'onyx';
        console.log(`[AudioService] ⚡ High-Speed Concurrency OpenAI Male Voice (${maleVoice}) for ${wordCount} words...`);
        progressService.updateProgress(jobId, 35, `🎙️ Synthesizing OpenAI Male Voice (${maleVoice})...`, `[AudioService] ⚡ High-Speed Concurrency OpenAI Male Voice (${maleVoice}) for ${wordCount} words...`, 'OpenAI Onyx');

        try {
          // Chunk text into <= 3500 character segments
          const textChunks: string[] = [];
          const paragraphs = episode.content.split(/\n+/);
          let currentChunk = '';

          for (const p of paragraphs) {
            if ((currentChunk + '\n' + p).length > 3500) {
              if (currentChunk.trim()) textChunks.push(currentChunk.trim());
              currentChunk = p;
            } else {
              currentChunk = currentChunk ? currentChunk + '\n' + p : p;
            }
          }
          if (currentChunk.trim()) textChunks.push(currentChunk.trim());

          progressService.updateProgress(jobId, 45, `🎙️ Parallel Synthesis Across ${textChunks.length} Chunks...`, `[AudioService] Split script into ${textChunks.length} parallel chunk(s)`, 'Promise.all');

          // PARALLEL SIMULTANEOUS PROMISE CONCURRENCY across all text chunks!
          const mp3Buffers = await Promise.all(textChunks.map(async (chunkText, index) => {
            const mp3 = await openai.audio.speech.create({
              model: 'tts-1',
              voice: maleVoice as any,
              input: chunkText,
              speed: 0.98,
            });
            const buf = Buffer.from(await mp3.arrayBuffer());
            progressService.updateProgress(jobId, 55 + (index * 5), `🎙️ Chunk ${index + 1}/${textChunks.length} Synthesized`, `[AudioService] Chunk ${index + 1} finished (${buf.byteLength} bytes)`, 'OpenAI TTS');
            return buf;
          }));

          const fullNarrationBuffer = Buffer.concat(mp3Buffers);
          fs.writeFileSync(narrationPath, fullNarrationBuffer);
          console.log(`[AudioService] 🚀 Parallel Concurrency OpenAI Male Voice Complete! Size: ${fullNarrationBuffer.byteLength} bytes.`);
          progressService.updateProgress(jobId, 70, `🚀 OpenAI Male Voice (${maleVoice}) Complete (${fullNarrationBuffer.byteLength} bytes)`, `[AudioService] 🚀 Parallel Concurrency OpenAI Male Voice Complete! Size: ${fullNarrationBuffer.byteLength} bytes.`, 'Narration Ready');
          return true;
        } catch (openaiTtsErr: any) {
          console.warn('[AudioService] OpenAI TTS Warning:', openaiTtsErr?.message || openaiTtsErr);
          progressService.updateProgress(jobId, 60, '⚠️ OpenAI TTS fallback triggered', `[AudioService] Warning: ${openaiTtsErr?.message}`, 'Fallback');
          return false;
        }
      })();

      const generateAmbiencePromise = (async () => {
        progressService.updateProgress(jobId, 50, '🔊 Synthesizing Wind Breeze Soundscape Bed...', '[AudioService] 🔊 Synthesizing Natural Wind Breeze Soundscape Bed...', 'Soundscape Synthesizer');
        AudioService.generateNaturalWindSoundscape(brief.ambience_description || 'Eerie wind breezing through bare trees', ambiencePath, estimatedNarrationDuration + 5);
      })();

      // Run TTS generation & Soundscape creation SIMULTANEOUSLY in parallel!
      const [speechSuccess] = await Promise.all([generateSpeechPromise, generateAmbiencePromise]);
      ttsSuccess = speechSuccess;

      // Fallback if OpenAI key is unavailable
      if (!ttsSuccess && !fs.existsSync(narrationPath)) {
        console.log(`[AudioService] 🗣️ Generating Spoken Audio Narration (${wordCount} words)...`);
        progressService.updateProgress(jobId, 65, '🗣️ Synthesizing Speech Narration...', `[AudioService] 🗣️ Generating Spoken Audio Narration (${wordCount} words)...`, 'Speech Synthesizer');
        await AudioService.generateFallbackSpeechNarrationMp3(episode.content, narrationPath);
      }

      // Calculate actual narration duration from the synthesized file size
      let actualNarrationDuration = estimatedNarrationDuration;
      try {
        const narrationStat = fs.statSync(narrationPath);
        actualNarrationDuration = Math.max(12, Math.ceil(narrationStat.size / 16000));
      } catch (e) {
        actualNarrationDuration = estimatedNarrationDuration;
      }

      // FFMPEG-STATIC LOUD VOICE DUCKING MIX: Boost Male Voice 2.5x (+8dB) & Cap Duration
      console.log(`[AudioService] 🎛️ ffmpeg-static Mixing Master Track (${actualNarrationDuration}s)...`);
      progressService.updateProgress(jobId, 85, `🎛️ ffmpeg-static Mixing Master Track (${actualNarrationDuration}s)...`, `[AudioService] 🎛️ ffmpeg-static Mixing Master Track (${actualNarrationDuration}s)...`, 'ffmpeg-static');
      
      if (ffmpegPath && fs.existsSync(narrationPath) && fs.existsSync(ambiencePath)) {
        try {
          const ffmpegCmd = `"${ffmpegPath}" -y -i "${narrationPath}" -stream_loop -1 -i "${ambiencePath}" -filter_complex "[1:a]volume=0.08[bg];[0:a]volume=2.5[voice];[bg][voice]amix=inputs=2:duration=first:normalize=0[out]" -map "[out]" -t ${actualNarrationDuration} "${outputPath}"`;
          await execAsync(ffmpegCmd);
          console.log(`[AudioService] ✅ Master Track Generated Successfully at ${outputPath}`);
          progressService.updateProgress(jobId, 95, '✅ ffmpeg-static Audio Ducks & Master Mix Complete', `[AudioService] ✅ Master Track Generated Successfully at ${outputPath}`, 'ffmpeg-static');
        } catch (mixErr: any) {
          console.warn('[AudioService] ffmpeg-static mix fallback:', mixErr?.message);
          fs.copyFileSync(narrationPath, outputPath);
        }
      } else if (fs.existsSync(narrationPath)) {
        fs.copyFileSync(narrationPath, outputPath);
      } else {
        await AudioService.generateFallbackSpeechNarrationMp3(episode.content, outputPath);
      }

      // Calculate final audio duration accurately from output file size
      let finalDuration = actualNarrationDuration;
      try {
        const stat = fs.statSync(outputPath);
        finalDuration = Math.max(10, Math.round(stat.size / 16000));
      } catch (e) {
        finalDuration = actualNarrationDuration;
      }

      // Clean up temp files
      if (fs.existsSync(narrationPath)) fs.unlinkSync(narrationPath);
      if (fs.existsSync(ambiencePath)) fs.unlinkSync(ambiencePath);

      // Update AudioRender record
      await dbRun(`
        UPDATE audio_renders 
        SET audio_url = ?, duration_seconds = ?, status = 'ready'
        WHERE id = ?
      `, [audioUrl, finalDuration, renderId]);

      // Update episode audio_status to 'ready_to_review'
      await dbRun(`
        UPDATE episodes 
        SET audio_status = 'ready_to_review', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [episodeId]);

      console.log(`[AudioService] ✅ High-Speed Male Voice Master Render Completed Successfully! File: ${audioUrl} (Duration: ${finalDuration}s). Episode Status: ready_to_review.`);
      progressService.completeProgress(jobId, `[AudioService] ✅ High-Speed Male Voice Master Render Completed Successfully! File: ${audioUrl} (Duration: ${finalDuration}s). Episode Status: ready_to_review.`);

      return {
        id: renderId,
        episode_id: episodeId,
        performance_brief: brief,
        voice_id: brief.voice_id,
        audio_url: audioUrl,
        duration_seconds: finalDuration,
        status: 'ready',
        created_at: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[AudioService] Audio Generation Failed:', err?.message || err);
      await dbRun('UPDATE audio_renders SET status = "failed" WHERE id = ?', [renderId]);
      await dbRun('UPDATE episodes SET audio_status = "none" WHERE id = ?', [episodeId]);
      progressService.failProgress(jobId, err?.message || 'Audio generation failed');
      throw err;
    }
  }

  /**
   * PHASE 1: Explicit Publish Action (Separate from Generate)
   */
  static async publishAudio(episodeId: string): Promise<any> {
    const episode = await dbGet<any>('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    if (episode.audio_status !== 'ready_to_review' && episode.audio_status !== 'published') {
      throw new Error('Episode audio must be in ready_to_review state before publishing.');
    }

    const now = new Date().toISOString();
    await dbRun(`
      UPDATE episodes 
      SET audio_status = 'published', published_at = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [now, episodeId]);

    console.log(`[AudioService] 🚀 EXPLICIT PUBLISH ACTION: Episode "${episode.title}" (${episodeId}) Audio Status updated to PUBLISHED at ${now}.`);

    return {
      episode_id: episodeId,
      audio_status: 'published',
      published_at: now,
    };
  }

  /**
   * Fetch Audio Render & Status
   */
  static async getAudioRender(episodeId: string): Promise<any> {
    const episode = await dbGet<any>('SELECT id, title, audio_status, published_at FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    const render = await dbGet<any>('SELECT * FROM audio_renders WHERE episode_id = ? AND status = "ready" ORDER BY created_at DESC LIMIT 1', [episodeId]);

    let parsedBrief = null;
    if (render && render.performance_brief) {
      try {
        parsedBrief = JSON.parse(render.performance_brief);
      } catch (e) {
        parsedBrief = null;
      }
    }

    return {
      episode_id: episodeId,
      audio_status: episode.audio_status || 'none',
      published_at: episode.published_at || null,
      latest_render: render ? {
        id: render.id,
        voice_id: render.voice_id,
        audio_url: render.audio_url,
        duration_seconds: render.duration_seconds,
        status: render.status,
        created_at: render.created_at,
        performance_brief: parsedBrief,
      } : null,
    };
  }

  // --- Phase 3: Multi-Language Audio Generation ---

  static async generateTranslationAudio(translationId: string, text: string, languageCode: string): Promise<any> {
    const renderId = uuidv4();
    const jobId = `translation-audio-${translationId}`;

    progressService.resetProgress(jobId);
    progressService.updateProgress(jobId, 10, '🎙️ Initializing Multi-Language Audio Synthesis...', `[AudioService] ⚡ Starting Audio Render for Translation ID: ${translationId}`, 'Google TTS');

    const filename = `translation-${renderId}.mp3`;
    const outputPath = path.join(PUBLIC_AUDIO_DIR, filename);
    const audioUrl = `/audio/${filename}`;

    try {
      progressService.updateProgress(jobId, 30, '🎙️ Fetching translated speech audio...', `[AudioService] Fetching speech for language ${languageCode}`, 'Google TTS');
      
      const cleanText = text.trim() || 'No text provided';
      const base64Chunks = await getAllAudioBase64(cleanText, {
        lang: languageCode,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 20000,
      });

      const rawBuffer = Buffer.concat(base64Chunks.map(c => Buffer.from(c.base64, 'base64')));
      let narrationPath = path.join(PUBLIC_AUDIO_DIR, `narration-${renderId}.mp3`);
      fs.writeFileSync(narrationPath, rawBuffer);

      let finalDuration = 0;
      try {
        const stat = fs.statSync(narrationPath);
        finalDuration = Math.max(10, Math.round(stat.size / 16000));
      } catch (e) {
        finalDuration = 10;
      }

      progressService.updateProgress(jobId, 70, '🎛️ Saving multi-language audio output...', '[AudioService] Saving output audio', 'Audio Engine');

      fs.renameSync(narrationPath, outputPath);

      await dbRun(`
        UPDATE translation_audio 
        SET audio_url = ?, duration_seconds = ?, status = 'ready'
        WHERE translation_id = ? AND status = 'generating'
      `, [audioUrl, finalDuration, translationId]);

      progressService.completeProgress(jobId, `[AudioService] ✅ Multi-Language Audio Render Complete! File: ${audioUrl}`);

      return {
        id: renderId,
        translation_id: translationId,
        audio_url: audioUrl,
        duration_seconds: finalDuration,
        status: 'ready',
      };
    } catch (err: any) {
      console.error('[AudioService] Translation Audio Generation Failed:', err?.message || err);
      await dbRun('UPDATE translation_audio SET status = "failed" WHERE translation_id = ? AND status = "generating"', [translationId]);
      progressService.failProgress(jobId, err?.message || 'Translation Audio generation failed');
      throw err;
    }
  }

  // --- Fallback Spoken Audio Generator (MP3) ---

  private static async generateFallbackSpeechNarrationMp3(text: string, outputPath: string): Promise<void> {
    try {
      const cleanText = text.trim() || 'No manuscript text content provided.';
      const base64Chunks = await getAllAudioBase64(cleanText, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });

      const rawBuffer = Buffer.concat(base64Chunks.map(c => Buffer.from(c.base64, 'base64')));
      
      // Pitch shift down by 4 semitones to male register
      if (ffmpegPath) {
        const rawPath = outputPath + '.raw.mp3';
        fs.writeFileSync(rawPath, rawBuffer);
        await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -af "asetrate=24000*0.78,aresample=24000,atempo=1.28" "${outputPath}"`);
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      } else {
        fs.writeFileSync(outputPath, rawBuffer);
      }
    } catch (err: any) {
      console.error('[AudioService] Fallback Speech Generator Error:', err?.message || err);
    }
  }

  // --- Paul Kellet's Pink Noise Natural Wind Breezing Generator (No Beep Tones!) ---

  private static generateNaturalWindSoundscape(prompt: string, outputPath: string, durationSeconds: number = 20): void {
    const sampleRate = 22050;
    const numSamples = sampleRate * durationSeconds;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // PCM
    buffer.writeUInt16LE(1, 20); // Mono
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    const textLower = (prompt || '').toLowerCase();
    const isHorror = textLower.includes('cremation') || textLower.includes('ghost') || textLower.includes('horror') || textLower.includes('eerie') || textLower.includes('wind');
    const isCity = textLower.includes('city') || textLower.includes('traffic') || textLower.includes('neon') || textLower.includes('rain');

    // Paul Kellet's Pink Noise Filter (Exact Natural Acoustic Spectrum of Wind Breezing)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      if (isHorror) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;

        // Soft breeze gust modulation (0.07Hz)
        const breezeSwell = (Math.sin(2 * Math.PI * 0.07 * t) + 1.2) * 0.5;
        // Warm earth sub-drone (42Hz - NO beep tone)
        const earthWarmth = Math.sin(2 * Math.PI * 42 * t) * 0.02;

        sample = pink * 0.25 * breezeSwell + earthWarmth;
      } else if (isCity) {
        const rainDrop = (Math.random() * 2 - 1) * 0.035;
        const trafficHum = Math.sin(2 * Math.PI * 68 * t) * 0.05;
        sample = rainDrop + trafficHum;
      } else {
        const roomHum = Math.sin(2 * Math.PI * 55 * t) * 0.03;
        sample = roomHum;
      }

      const clamped = Math.max(-0.95, Math.min(0.95, sample));
      buffer.writeInt16LE(Math.floor(clamped * 32767), 44 + i * 2);
    }

    fs.writeFileSync(outputPath, buffer);
  }
}

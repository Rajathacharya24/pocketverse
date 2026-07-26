import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pocketverse.db');
export const db = new sqlite3.Database(dbPath);

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Table 1: Series
      db.run(`
        CREATE TABLE IF NOT EXISTS series (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          target_languages TEXT DEFAULT '[]',
          creator_id TEXT NOT NULL DEFAULT 'creator-default',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table 2: Episodes
      db.run(`
        CREATE TABLE IF NOT EXISTS episodes (
          id TEXT PRIMARY KEY,
          series_id TEXT NOT NULL,
          episode_number INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT CHECK(status IN ('draft', 'analyzed', 'finalized')) DEFAULT 'draft',
          audio_status TEXT CHECK(audio_status IN ('none', 'generating', 'ready_to_review', 'published')) DEFAULT 'none',
          published_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
        );
      `);

      // Table 3: AnalysisRuns
      db.run(`
        CREATE TABLE IF NOT EXISTS analysis_runs (
          id TEXT PRIMARY KEY,
          episode_id TEXT NOT NULL,
          continuity_result TEXT,
          grammar_result TEXT,
          tone_remix_result TEXT,
          status TEXT CHECK(status IN ('pending', 'continuity_done', 'grammar_done', 'tone_step', 'complete')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );
      `);

      // Table 4: AudioRenders
      db.run(`
        CREATE TABLE IF NOT EXISTS audio_renders (
          id TEXT PRIMARY KEY,
          episode_id TEXT NOT NULL,
          performance_brief TEXT NOT NULL,
          voice_id TEXT NOT NULL,
          audio_url TEXT NOT NULL,
          duration_seconds REAL NOT NULL DEFAULT 0,
          status TEXT CHECK(status IN ('generating', 'ready', 'failed')) DEFAULT 'generating',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );
      `);

      // Table 5: Translations
      db.run(`
        CREATE TABLE IF NOT EXISTS translations (
          id TEXT PRIMARY KEY,
          episode_id TEXT NOT NULL,
          language TEXT NOT NULL,
          translated_content TEXT NOT NULL,
          status TEXT CHECK(status IN ('translating', 'needs_review', 'ready', 'published')) DEFAULT 'translating',
          localization_notes TEXT,
          published_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );
      `);

      // Table 6: TranslationAudio
      db.run(`
        CREATE TABLE IF NOT EXISTS translation_audio (
          id TEXT PRIMARY KEY,
          translation_id TEXT NOT NULL,
          audio_url TEXT NOT NULL,
          duration_seconds REAL NOT NULL DEFAULT 0,
          status TEXT CHECK(status IN ('generating', 'ready', 'failed', 'published')) DEFAULT 'generating',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE
        );
      `);

      // Schema Migrations for existing database tables
      db.run(`ALTER TABLE episodes ADD COLUMN audio_status TEXT CHECK(audio_status IN ('none', 'generating', 'ready_to_review', 'published')) DEFAULT 'none'`, () => {});
      db.run(`ALTER TABLE episodes ADD COLUMN published_at DATETIME`, () => {});

      db.run('SELECT 1', (err) => {
        if (err) {
          console.error('Error initializing database tables:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully at', dbPath);
          resolve();
        }
      });
    });
  });
}

// Database helper promises
export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

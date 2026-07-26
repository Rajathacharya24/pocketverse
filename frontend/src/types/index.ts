export interface Series {
  id: string;
  title: string;
  target_languages?: string[];
  creator_id: string;
  created_at: string;
  episodes?: Episode[];
  episode_count?: number; // Only returned by getAllSeries
}

export type EpisodeStatus = 'draft' | 'analyzed' | 'finalized';

export type AudioStatus = 'none' | 'generating' | 'ready_to_review' | 'published';

export interface Episode {
  id: string;
  series_id: string;
  episode_number: number;
  title: string;
  content: string;
  status: EpisodeStatus;
  audio_status?: AudioStatus;
  translations?: Translation[];
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface AudioRender {
  id: string;
  episode_id: string;
  performance_brief: PerformanceBrief;
  voice_id: string;
  audio_url: string;
  duration_seconds: number;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
}

export interface ContinuityIssue {
  id: string;
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  snippet: string;
  description: string;
  suggestion: string;
  accepted: boolean;
}

export interface HookCheck {
  score: number; // 1 to 10
  status: 'strong' | 'moderate' | 'flat';
  review: string;
  suggestion: string;
  accepted?: boolean;
}

export interface ContinuityResult {
  issues: ContinuityIssue[];
  matched_against_episode_id: string | null;
  matched_against_episode_title?: string | null;
  hook_check: HookCheck;
}

export interface GrammarIssue {
  id: string;
  snippet: string;
  issue: string;
  suggested_fix: string;
  accepted: boolean;
}

export interface ToneRemixResult {
  category: string;
  original_content: string;
  remixed_content: string;
  summary: string;
  accepted: boolean;
}

export type AnalysisStatus = 'pending' | 'continuity_done' | 'grammar_done' | 'tone_step' | 'complete';

export interface AnalysisRun {
  id: string;
  episode_id: string;
  continuity_result?: ContinuityResult | null;
  grammar_result?: GrammarIssue[] | null;
  tone_remix_result?: ToneRemixResult | null;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;
}

export interface QAIssue {
  id: string;
  snippet: string;
  issue: string;
  suggested_fix: string;
  accepted: boolean;
}

export type TranslationStatus = 'translating' | 'needs_review' | 'ready' | 'published';

export interface Translation {
  id: string;
  episode_id: string;
  language: string;
  translated_content: string;
  status: TranslationStatus;
  localization_notes: QAIssue[] | null;
  audio?: TranslationAudio | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type TranslationAudioStatus = 'generating' | 'ready' | 'failed' | 'published';

export interface TranslationAudio {
  id: string;
  translation_id: string;
  audio_url: string;
  duration_seconds: number;
  status: TranslationAudioStatus;
  created_at: string;
}

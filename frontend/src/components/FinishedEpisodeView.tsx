import React from 'react';
import { ArrowLeft, CheckCircle2, FileText, Sparkles, BookOpen, Volume2 } from 'lucide-react';
import { Episode } from '../types';

interface FinishedEpisodeViewProps {
  episode: Episode;
  seriesTitle: string;
  analysisRun?: any;
  onBackToEditor: () => void;
  onOpenAudioStudio?: () => void;
}

export const FinishedEpisodeView: React.FC<FinishedEpisodeViewProps> = ({
  episode,
  seriesTitle,
  analysisRun,
  onBackToEditor,
  onOpenAudioStudio,
}) => {
  const paragraphs = episode.content.split(/\n+/).filter(p => p.trim());

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-outline" onClick={onBackToEditor} style={{ fontSize: '0.75rem' }}>
          <ArrowLeft size={14} /> Back to Editor
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge-pill badge-finalized" style={{ fontSize: '0.55rem', padding: '0.15rem 0.5rem' }}>
            <span className="badge-dot" /> Finalized
          </span>

          {onOpenAudioStudio && (
            <button className="btn btn-primary" onClick={onOpenAudioStudio} style={{ fontSize: '0.75rem' }}>
              <Volume2 size={14} />
              {episode.audio_status && episode.audio_status !== 'none' ? 'Audio Studio' : 'Generate Audio'}
            </button>
          )}
        </div>
      </div>

      {/* Script Header */}
      <div style={{
        textAlign: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--bg-panel)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-accent)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="hero-glow" style={{ height: '200px' }} />

        <div className="eyebrow" style={{ color: 'var(--accent-red)', marginBottom: '0.4rem', position: 'relative', zIndex: 1 }}>
          {seriesTitle} · Episode {episode.episode_number}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700,
          marginBottom: '0.75rem', letterSpacing: '-0.01em', position: 'relative', zIndex: 1,
        }}>
          {episode.title}
        </h1>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          fontSize: '0.75rem', color: 'var(--ink-muted)',
          background: 'var(--bg-panel-elevated)', padding: '0.3rem 0.75rem',
          borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)',
          position: 'relative', zIndex: 1,
        }}>
          <span>{paragraphs.length} paragraphs</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{episode.content.trim().split(/\s+/).length} words</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Finalized {new Date(episode.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Analysis Badge */}
      {analysisRun && (
        <div style={{
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-accent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={16} color="var(--accent-red)" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI Analysis Complete</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                Continuity verified · Copyedited · Style refined
              </div>
            </div>
          </div>
          <span className="badge-pill badge-finalized" style={{ fontSize: '0.55rem' }}>
            <CheckCircle2 size={10} /> Verified
          </span>
        </div>
      )}

      {/* Script Body */}
      <article style={{
        padding: '2rem 2.5rem',
        background: 'var(--bg-panel-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        lineHeight: 1.85,
        fontSize: '0.98rem',
        color: 'var(--ink-primary)',
        boxShadow: 'var(--shadow-md)',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        {paragraphs.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>No content in this finalized script.</p>
        ) : (
          paragraphs.map((p, index) => (
            <p key={index} style={{ marginBottom: '1.25rem', textIndent: p.startsWith('[') || p.startsWith('"') || p.startsWith("'") ? 0 : '1.25rem' }}>
              {p}
            </p>
          ))
        )}
      </article>
    </main>
  );
};

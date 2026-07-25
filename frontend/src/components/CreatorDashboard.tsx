import React, { useState } from 'react';
import { Series, Episode } from '../types';
import { Plus, Play, Volume2, Edit3, Trash2, RotateCw, FileText, Sparkles, CheckCircle2, ShieldCheck, Clock, Layers, UserCheck, ArrowRight, Mic, Zap, BookOpen, TrendingUp } from 'lucide-react';
import { api } from '../api/client';

interface CreatorDashboardProps {
  series: Series | null;
  seriesList: Series[];
  selectedEpisodeId: string | null;
  onSelectSeries: (series: Series) => void;
  onSelectEpisode: (episodeId: string) => void;
  onCreateEpisode: () => void;
  onOpenNewSeriesModal: () => void;
  onDeleteEpisode: (episodeId: string, e: React.MouseEvent) => void;
  onOpenAudioStudio: (episode: Episode, e?: React.MouseEvent) => void;
  onOpenWizard: (episode: Episode) => void;
  onRefreshSeries: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  series,
  seriesList,
  selectedEpisodeId,
  onSelectSeries,
  onSelectEpisode,
  onCreateEpisode,
  onOpenNewSeriesModal,
  onDeleteEpisode,
  onOpenAudioStudio,
  onOpenWizard,
  onRefreshSeries,
}) => {
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [savingScript, setSavingScript] = useState<boolean>(false);
  const [autoRegenAudio, setAutoRegenAudio] = useState<boolean>(true);

  // ── No Series: Full Welcome Screen ──
  if (!series) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
        {/* Welcome Hero */}
        <div style={{
          padding: '3rem 2rem',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background gradient */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '600px', height: '300px',
            background: 'radial-gradient(ellipse, rgba(232, 56, 79, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--accent-red), var(--accent-amber))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 24px rgba(232, 56, 79, 0.3)',
            }}>
              <Zap size={28} color="#FFF" />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700,
              marginBottom: '0.65rem', letterSpacing: '-0.01em',
            }}>
              Welcome to PocketVerse
            </h2>
            <p style={{
              color: 'var(--ink-secondary)', margin: '0 auto 1.75rem',
              maxWidth: '460px', fontSize: '0.92rem', lineHeight: 1.6,
            }}>
              Your AI production studio is ready. Create a series to start writing episodes,
              run AI analysis, and generate cinematic audio with one click.
            </p>
            <button className="btn btn-primary" onClick={onOpenNewSeriesModal} style={{ padding: '0.7rem 1.75rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Create Your First Series
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="stagger-reveal" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
        }}>
          {[
            { icon: <FileText size={20} />, title: 'Write Episodes', desc: 'Draft scripts with a focused writing editor. Track word counts and episode structure.', color: 'var(--accent-red)' },
            { icon: <Sparkles size={20} />, title: 'AI Story Analysis', desc: 'GPT-4o checks continuity, catches plot holes, fixes grammar, and remixes tone.', color: 'var(--accent-amber)' },
            { icon: <Mic size={20} />, title: 'Voice & Soundscape', desc: 'Generate HD voice narration with ambient soundscapes — wind, rain, thunder.', color: 'var(--accent-red)' },
            { icon: <TrendingUp size={20} />, title: 'Track Progress', desc: 'See analytics across all episodes — word count, audio status, estimated runtime.', color: 'var(--accent-amber)' },
          ].map((f, i) => (
            <div key={i} className={f.color === 'var(--accent-red)' ? 'depth-red panel-sheen' : 'depth-amber panel-sheen'} style={{
              padding: '1.25rem',
              background: 'var(--bg-panel)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${f.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color,
              }}>
                {f.icon}
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>{f.title}</h4>
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const episodes = series.episodes || [];

  // Analytics
  const totalEpisodes = episodes.length;
  const totalWords = episodes.reduce((sum, ep) => sum + (ep.content ? ep.content.trim().split(/\s+/).filter(Boolean).length : 0), 0);
  const episodesWithAudio = episodes.filter(ep => ep.audio_status === 'ready_to_review' || ep.audio_status === 'published').length;
  const totalAudioMinutes = Math.round(episodes.reduce((sum, ep) => sum + (ep.content ? ep.content.trim().split(/\s+/).filter(Boolean).length / 130 : 0), 0));
  const analyzedEpisodes = episodes.filter(ep => ep.status === 'analyzed' || ep.status === 'finalized').length;

  const handleOpenEditModal = (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEpisode(ep);
    setEditTitle(ep.title);
    setEditContent(ep.content || '');
    setAutoRegenAudio(ep.audio_status === 'ready_to_review' || ep.audio_status === 'published');
  };

  const handleSaveScriptChanges = async () => {
    if (!editingEpisode) return;
    setSavingScript(true);
    try {
      await api.updateEpisode(editingEpisode.id, { title: editTitle, content: editContent });
      if (autoRegenAudio) {
        const updatedEp = { ...editingEpisode, title: editTitle, content: editContent };
        setEditingEpisode(null);
        onRefreshSeries();
        onOpenAudioStudio(updatedEp);
      } else {
        setEditingEpisode(null);
        onRefreshSeries();
      }
    } catch (err: any) {
      console.error('Failed to save script edits:', err);
      alert(err.message || 'Failed to save script changes');
    } finally {
      setSavingScript(false);
    }
  };

  const handleReGenerateAudio = (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenAudioStudio(ep, e);
  };

  const statCards = [
    { label: 'Episodes', value: totalEpisodes.toString(), sub: totalEpisodes === 1 ? 'episode created' : 'episodes created', icon: <Layers size={18} />, color: 'var(--accent-red)', bg: 'linear-gradient(135deg, rgba(217,30,54,0.12), rgba(217,30,54,0.04))' },
    { label: 'Manuscript', value: totalWords.toLocaleString(), sub: 'total words written', icon: <BookOpen size={18} />, color: 'var(--accent-amber)', bg: 'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04))' },
    { label: 'AI Analyzed', value: `${analyzedEpisodes}/${totalEpisodes}`, sub: 'episodes reviewed by AI', icon: <Sparkles size={18} />, color: 'var(--accent-red)', bg: 'linear-gradient(135deg, rgba(217,30,54,0.12), rgba(217,30,54,0.04))' },
    { label: 'Audio Ready', value: `${episodesWithAudio}/${totalEpisodes}`, sub: `~${totalAudioMinutes}m total runtime`, icon: <Mic size={18} />, color: 'var(--accent-amber)', bg: 'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04))' },
  ];

  // ── Production Pipeline: compute stage counts ──
  const pipelineStages = [
    { label: 'Draft', count: episodes.filter(e => e.status === 'draft').length, active: episodes.some(e => e.status === 'draft') },
    { label: 'Analyzed', count: analyzedEpisodes, active: episodes.some(e => e.status === 'analyzed') },
    { label: 'Audio', count: episodesWithAudio, active: episodes.some(e => e.audio_status === 'generating') },
    { label: 'Published', count: episodes.filter(e => e.audio_status === 'published').length, active: episodes.some(e => e.audio_status === 'published') },
  ];
  const hasActiveWork = pipelineStages.some(s => s.active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
      {/* ── Scan Line Atmosphere ── */}
      <div className="scan-line" aria-hidden="true" />

      {/* ── Series Header Banner with diagonal cut ── */}
      <div className="diagonal-cut" style={{
        padding: '1.5rem 1.75rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle red line accent at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, var(--accent-red), transparent 60%)',
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{
              fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--accent-amber)',
              background: 'rgba(217, 119, 6, 0.12)', padding: '0.15rem 0.55rem',
              borderRadius: 'var(--radius-pill)', border: '1px solid rgba(217, 119, 6, 0.25)',
            }}>
              Active Workspace
            </span>
            {analyzedEpisodes > 0 && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--accent-red)',
                background: 'rgba(217, 30, 54, 0.12)', padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-pill)', border: '1px solid rgba(217, 30, 54, 0.25)',
              }}>
                <CheckCircle2 size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                AI Active
              </span>
            )}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700,
            margin: 0, letterSpacing: '-0.01em',
          }}>
            {series.title}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: '0.3rem' }}>
            {totalEpisodes} episode{totalEpisodes !== 1 ? 's' : ''} · {totalWords.toLocaleString()} words · ~{totalAudioMinutes}m audio
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button className="btn btn-outline" onClick={onOpenNewSeriesModal} style={{ fontSize: '0.76rem' }}>
            <Plus size={14} /> New Series
          </button>
          <button className="btn btn-primary" onClick={onCreateEpisode} style={{ fontSize: '0.76rem' }}>
            <Plus size={14} /> Add Episode
          </button>
        </div>
      </div>

      {/* ── Production Pipeline Visualization (Signature Element) ── */}
      {episodes.length > 0 && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          position: 'relative', overflow: 'hidden',
        }} className="panel-sheen">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)' }}>
              Production Pipeline
            </span>
            {hasActiveWork && (
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-red)', animation: 'pipeline-pulse 2s ease-in-out infinite' }} />
                Active
              </span>
            )}
          </div>

          <svg width="100%" height="48" viewBox="0 0 600 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            {/* Connecting lines */}
            {[0, 1, 2].map(i => (
              <line
                key={i}
                x1={75 + i * 150}
                y1={24}
                x2={135 + i * 150}
                y2={24}
                stroke={pipelineStages[i + 1]?.count > 0 ? '#D91E36' : '#3A2A2C'}
                strokeWidth={1.5}
                strokeDasharray={pipelineStages[i + 1]?.count > 0 ? 'none' : '4 4'}
                opacity={pipelineStages[i + 1]?.count > 0 ? 0.6 : 0.3}
              />
            ))}

            {/* Tracing dot (animated when active) */}
            {hasActiveWork && (
              <circle r="3" fill="#D91E36" opacity="0.8">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path="M60,24 L210,24 L360,24 L510,24"
                />
              </circle>
            )}

            {/* Stage nodes */}
            {pipelineStages.map((stage, i) => {
              const cx = 60 + i * 150;
              const isActive = stage.active;
              const hasCount = stage.count > 0;
              return (
                <g key={stage.label}>
                  {/* Glow ring when active */}
                  {isActive && (
                    <circle cx={cx} cy={24} r={18} fill="none" stroke="#D91E36" strokeWidth={1} opacity={0.3}>
                      <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={cx}
                    cy={24}
                    r={14}
                    fill={hasCount ? 'rgba(217, 30, 54, 0.12)' : '#1F1718'}
                    stroke={hasCount ? '#D91E36' : '#3A2A2C'}
                    strokeWidth={1.5}
                  />
                  <text
                    x={cx}
                    y={21}
                    textAnchor="middle"
                    fill={hasCount ? '#F2F0EF' : '#6E5F60'}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="'Archivo Black', sans-serif"
                  >
                    {stage.count}
                  </text>
                  <text
                    x={cx}
                    y={33}
                    textAnchor="middle"
                    fill={hasCount ? '#9C8C8D' : '#6E5F60'}
                    fontSize="7"
                    fontWeight="500"
                    fontFamily="'Space Grotesk', sans-serif"
                    letterSpacing="0.08em"
                  >
                    {stage.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* ── Stats Grid with depth shadows ── */}
      <div className="stagger-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        {statCards.map((stat) => (
          <div key={stat.label} className={stat.color === 'var(--accent-red)' ? 'depth-red' : 'depth-amber'} style={{
            padding: '1.15rem 1.25rem',
            background: stat.bg,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: `${stat.color}18`,
              border: `1px solid ${stat.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color, flexShrink: 0,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--ink-secondary)', marginTop: '0.15rem' }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Episode Directory ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '1rem',
            fontWeight: 600, margin: 0,
          }}>
            Episode Directory
          </h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
            Click to edit · Hover for actions
          </span>
        </div>

        {episodes.length === 0 ? (
          <div className="panel-sheen" style={{
            padding: '3rem 2rem',
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'var(--accent-red-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <FileText size={24} color="var(--accent-red)" />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, margin: '0 0 0.4rem 0', fontSize: '1.05rem' }}>
              No episodes yet
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem', maxWidth: '360px' }}>
              Create your first episode for "{series.title}" to start the AI production pipeline.
            </p>
            <button className="btn btn-primary" onClick={onCreateEpisode} style={{ fontSize: '0.8rem' }}>
              <Plus size={14} /> Create Episode 1
            </button>

            {/* Quick workflow hint */}
            <div style={{
              marginTop: '2rem', padding: '1rem 1.25rem',
              background: 'var(--bg-panel-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center',
              width: '100%', maxWidth: '560px',
            }}>
              {[
                { step: '1', label: 'Write', desc: 'Draft your script' },
                { step: '2', label: 'Analyze', desc: 'AI reviews & fixes' },
                { step: '3', label: 'Generate', desc: 'HD voice + soundscape' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--accent-red)', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--ink-muted)' }}>{s.desc}</div>
                  </div>
                  {i < 2 && <ArrowRight size={12} color="var(--ink-dim)" style={{ marginLeft: '0.5rem' }} />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="stagger-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {episodes.map((ep) => {
              const isSelected = selectedEpisodeId === ep.id;
              const wordCount = ep.content ? ep.content.trim().split(/\s+/).filter(Boolean).length : 0;
              const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));
              const hasAudio = ep.audio_status === 'ready_to_review' || ep.audio_status === 'published';
              const isAnalyzed = ep.status === 'analyzed' || ep.status === 'finalized';

              return (
                <div
                  key={ep.id}
                  className="ep-row"
                  onClick={() => onSelectEpisode(ep.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--border-accent-strong)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'var(--accent-red-subtle)' : 'var(--bg-panel)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Episode Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '240px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: hasAudio
                        ? 'linear-gradient(135deg, rgba(217,30,54,0.12), rgba(217,30,54,0.04))'
                        : isAnalyzed
                          ? 'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04))'
                          : 'linear-gradient(135deg, rgba(110,95,96,0.12), rgba(110,95,96,0.04))',
                      border: `1px solid ${hasAudio ? 'rgba(217,30,54,0.25)' : isAnalyzed ? 'rgba(217,119,6,0.25)' : 'var(--border)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.9rem',
                      color: hasAudio ? 'var(--accent-red)' : isAnalyzed ? 'var(--accent-amber)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '0.45rem', opacity: 0.7, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.05em' }}>EP</span>
                      <span style={{ lineHeight: 1 }}>{ep.episode_number}</span>
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                          {ep.title}
                        </span>
                        {ep.audio_status === 'published' ? (
                          <span className="badge-pill badge-finalized" style={{ fontSize: '0.52rem', padding: '0.08rem 0.4rem' }}>
                            <ShieldCheck size={8} /> Published
                          </span>
                        ) : ep.audio_status === 'ready_to_review' ? (
                          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.52rem', padding: '0.08rem 0.4rem' }}>
                            <Sparkles size={8} /> Audio Ready
                          </span>
                        ) : ep.status === 'finalized' ? (
                          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.52rem', padding: '0.08rem 0.4rem' }}>
                            <CheckCircle2 size={8} /> Finalized
                          </span>
                        ) : ep.status === 'analyzed' ? (
                          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.52rem', padding: '0.08rem 0.4rem' }}>
                            Analyzed
                          </span>
                        ) : (
                          <span className="badge-pill badge-draft" style={{ fontSize: '0.52rem', padding: '0.08rem 0.4rem' }}>
                            Draft
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span><FileText size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />{wordCount} words</span>
                        <span style={{ opacity: 0.3 }}>·</span>
                        <span><Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />~{estimatedMinutes}m</span>
                        {hasAudio && (
                          <>
                            <span style={{ opacity: 0.3 }}>·</span>
                            <span style={{ color: 'var(--success)' }}>
                              <Volume2 size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Audio ✓
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {hasAudio ? (
                      <button
                        className="btn"
                        onClick={(e) => { e.stopPropagation(); onOpenAudioStudio(ep, e); }}
                        style={{
                          fontSize: '0.72rem', padding: '0.4rem 0.85rem',
                          background: 'rgba(95, 224, 122, 0.08)',
                          color: 'var(--success)', border: '1px solid rgba(95, 224, 122, 0.25)',
                        }}
                      >
                        <Play size={12} style={{ fill: 'currentColor' }} /> Play
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => { e.stopPropagation(); onOpenAudioStudio(ep, e); }}
                        style={{ fontSize: '0.72rem', padding: '0.4rem 0.85rem' }}
                      >
                        <Volume2 size={12} /> Generate
                      </button>
                    )}

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1px',
                      background: 'var(--bg-panel-elevated)',
                      padding: '2px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <button
                        title="Edit Script"
                        onClick={(e) => handleOpenEditModal(ep, e)}
                        style={{ border: 'none', padding: '0.3rem', borderRadius: '3px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Edit3 size={13} color="var(--ink-secondary)" />
                      </button>
                      <button
                        title="Re-Generate Audio"
                        onClick={(e) => handleReGenerateAudio(ep, e)}
                        style={{ border: 'none', padding: '0.3rem', borderRadius: '3px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <RotateCw size={13} color="var(--ink-secondary)" />
                      </button>
                      <button
                        title="Delete Episode"
                        onClick={(e) => onDeleteEpisode(ep.id, e)}
                        className="btn-danger"
                        style={{ border: 'none', padding: '0.3rem', borderRadius: '3px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Actions Footer ── */}
      {episodes.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem',
        }}>
          <div
            onClick={onCreateEpisode}
            style={{
              padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'var(--accent-red-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>Add Episode</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>Write Episode {totalEpisodes + 1}</div>
            </div>
          </div>

          {episodes.length > 0 && episodes[episodes.length - 1].status === 'draft' && (
            <div
              onClick={() => onOpenWizard(episodes[episodes.length - 1])}
              style={{
                padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(217, 119, 6, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color="var(--secondary)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>Run AI Analysis</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>On Ep {episodes[episodes.length - 1].episode_number}: {episodes[episodes.length - 1].title}</div>
              </div>
            </div>
          )}

          {episodes.some(ep => ep.status === 'finalized' && (!ep.audio_status || ep.audio_status === 'none')) && (
            <div
              onClick={() => {
                const ep = episodes.find(e => e.status === 'finalized' && (!e.audio_status || e.audio_status === 'none'));
                if (ep) onOpenAudioStudio(ep);
              }}
              style={{
                padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(217, 30, 54, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mic size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>Generate Audio</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>Convert a finalized episode to audio</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingEpisode && (
        <div className="modal-overlay" style={{ zIndex: 220 }} onClick={() => setEditingEpisode(null)}>
          <div className="modal-card" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={18} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Edit Episode {editingEpisode.episode_number}
                </h3>
              </div>
              <button onClick={() => setEditingEpisode(null)} style={{ border: 'none', padding: '0.3rem', cursor: 'pointer', background: 'transparent', color: 'var(--ink-muted)', fontSize: '1.1rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '0.3rem' }}>Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Episode Title..." />
              </div>

              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '0.3rem' }}>Manuscript</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Type manuscript text..."
                  style={{ minHeight: '220px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.65 }}
                />
              </div>

              <label style={{
                padding: '0.7rem 0.85rem',
                background: 'var(--accent-red-subtle)',
                border: '1px solid rgba(232, 56, 79, 0.15)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', fontSize: '0.8rem',
              }}>
                <input
                  type="checkbox"
                  checked={autoRegenAudio}
                  onChange={e => setAutoRegenAudio(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-red)' }}
                />
                <span style={{ fontWeight: 500, color: 'var(--ink-primary)' }}>
                  Open Audio Studio after saving to regenerate voice track
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button className="btn btn-outline" onClick={() => setEditingEpisode(null)} disabled={savingScript}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveScriptChanges} disabled={savingScript}>
                {savingScript ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

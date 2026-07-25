import React from 'react';
import { Plus, Trash2, FileText, CheckCircle2, Volume2, Sparkles, RotateCw, Lock } from 'lucide-react';
import { Episode } from '../types';

interface EpisodeListProps {
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onSelectEpisode: (id: string) => void;
  onCreateEpisode: () => void;
  onDeleteEpisode: (id: string, e: React.MouseEvent) => void;
  onOpenAudioStudio: (episode: Episode, e: React.MouseEvent) => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  selectedEpisodeId,
  onSelectEpisode,
  onCreateEpisode,
  onDeleteEpisode,
  onOpenAudioStudio,
}) => {
  const getAudioBadge = (episode: Episode) => {
    const isFinalized = episode.status === 'finalized';
    const audioStatus = episode.audio_status;

    if (!isFinalized) {
      return (
        <span className="badge-pill badge-draft" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
          <Lock size={8} /> Pending
        </span>
      );
    }

    switch (audioStatus) {
      case 'generating':
        return (
          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
            <RotateCw size={8} className="spin" /> Generating
          </span>
        );
      case 'ready_to_review':
        return (
          <span className="badge-pill" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderColor: 'rgba(217, 119, 6, 0.25)', color: 'var(--accent-amber)', background: 'rgba(217, 119, 6, 0.12)' }}>
            <Sparkles size={8} /> Ready
          </span>
        );
      case 'published':
        return (
          <span className="badge-pill badge-finalized" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
            <CheckCircle2 size={8} /> Published
          </span>
        );
      default:
        return (
          <span className="badge-pill badge-draft" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
            No Audio
          </span>
        );
    }
  };

  return (
    <aside style={{
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      height: 'calc(100vh - 110px)',
      position: 'sticky',
      top: '80px',
      background: 'var(--bg-panel)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
      padding: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={15} color="var(--accent-red)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Episodes</h2>
        </div>
        <button className="btn btn-primary" onClick={onCreateEpisode} style={{ padding: '0.3rem 0.55rem', fontSize: '0.7rem' }}>
          <Plus size={12} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {episodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0.75rem', color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
            No episodes yet.
          </div>
        ) : (
          episodes.map(episode => {
            const isSelected = episode.id === selectedEpisodeId;
            const isFinalized = episode.status === 'finalized';

            return (
              <div
                key={episode.id}
                onClick={() => onSelectEpisode(episode.id)}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--accent-red-subtle)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Ep {episode.episode_number}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {episode.status === 'draft' && <span className="badge-pill badge-draft" style={{ fontSize: '0.5rem', padding: '0.08rem 0.35rem' }}>Draft</span>}
                    {episode.status === 'analyzed' && <span className="badge-pill badge-analyzed" style={{ fontSize: '0.5rem', padding: '0.08rem 0.35rem' }}>Analyzed</span>}
                    {episode.status === 'finalized' && <span className="badge-pill badge-finalized" style={{ fontSize: '0.5rem', padding: '0.08rem 0.35rem' }}>Final</span>}

                    <button
                      className="btn-outline"
                      style={{ padding: '0.15rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      onClick={(e) => onDeleteEpisode(episode.id, e)}
                      title="Delete Episode"
                    >
                      <Trash2 size={11} color="var(--ink-dim)" />
                    </button>
                  </div>
                </div>

                <div style={{
                  fontWeight: 600, fontSize: '0.82rem', color: 'var(--ink-primary)',
                  marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {episode.title}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '0.3rem', borderTop: '1px solid var(--border-subtle)',
                }}>
                  {getAudioBadge(episode)}

                  {isFinalized ? (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.6rem', gap: '0.2rem' }}
                      onClick={(e) => onOpenAudioStudio(episode, e)}
                    >
                      <Volume2 size={9} />
                      {episode.audio_status === 'none' || !episode.audio_status ? 'Audio' : 'Studio'}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.6rem', color: 'var(--ink-dim)', fontStyle: 'italic' }}>
                      Run AI First
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

import React from 'react';
import { Plus, Zap, PlusCircle } from 'lucide-react';
import { Series } from '../types';

interface HeaderProps {
  seriesList: Series[];
  selectedSeries: Series | null;
  onSelectSeries: (series: Series) => void;
  onOpenNewSeriesModal: () => void;
  onCreateEpisode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  seriesList,
  selectedSeries,
  onSelectSeries,
  onOpenNewSeriesModal,
  onCreateEpisode,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.9rem 0',
      marginBottom: '1rem',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(217, 30, 54, 0.25)',
          }}>
            <Zap size={16} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              Pocket<span style={{ color: 'var(--primary)' }}>Verse</span>
            </h1>
            <div style={{
              fontSize: '0.58rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--ink-muted)',
              marginTop: '2px',
            }}>
              AI Production Studio
            </div>
          </div>
        </div>

        {/* Series Switcher */}
        {seriesList.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginLeft: '0.5rem',
            paddingLeft: '1rem',
            borderLeft: '1px solid var(--border-subtle)',
          }}>
            <select
              value={selectedSeries?.id || ''}
              onChange={(e) => {
                const s = seriesList.find((item) => item.id === e.target.value);
                if (s) onSelectSeries(s);
              }}
              style={{
                width: 'auto',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-default)',
                color: 'var(--ink-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.episodes?.length || 0} Ep)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {selectedSeries && onCreateEpisode && (
          <button
            className="btn btn-primary"
            onClick={onCreateEpisode}
            style={{ fontSize: '0.78rem' }}
          >
            <PlusCircle size={14} />
            New Episode
          </button>
        )}

        <button className="btn btn-outline" onClick={onOpenNewSeriesModal} style={{ fontSize: '0.78rem' }}>
          <Plus size={14} />
          New Series
        </button>
      </div>
    </header>
  );
};

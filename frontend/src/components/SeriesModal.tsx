import React, { useState } from 'react';
import { X, Sparkles, FolderPlus } from 'lucide-react';

interface SeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSeries: (title: string, targetLanguages: string[]) => Promise<void>;
}

export const SeriesModal: React.FC<SeriesModalProps> = ({
  isOpen,
  onClose,
  onCreateSeries,
}) => {
  const [title, setTitle] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const AVAILABLE_LANGUAGES = [
    { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
    { code: 'ta', name: 'தமிழ்', label: 'Tamil' },
    { code: 'te', name: 'తెలుగు', label: 'Telugu' }
  ];

  const handleLanguageToggle = (code: string) => {
    setSelectedLanguages(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a series title');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onCreateSeries(title.trim(), selectedLanguages);
      setTitle('');
      setSelectedLanguages([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderPlus size={24} className="accent-text" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Create New Series</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '0.4rem', borderRadius: '50%', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
              Series Title
            </label>
            <input
              type="text"
              placeholder="e.g. Neon Horizon: Season 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {error && (
              <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
              Localized Versions (Optional)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>
              Select languages to automatically set up localization playlists for this series.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {AVAILABLE_LANGUAGES.map(lang => (
                <label 
                  key={lang.code}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.4rem', 
                    padding: '0.4rem 0.75rem', 
                    background: selectedLanguages.includes(lang.code) ? 'rgba(232, 56, 79, 0.1)' : 'var(--bg-panel-elevated)',
                    border: `1px solid ${selectedLanguages.includes(lang.code) ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedLanguages.includes(lang.code)}
                    onChange={() => handleLanguageToggle(lang.code)}
                    style={{ margin: 0, accentColor: 'var(--accent-red)' }}
                  />
                  <span>{lang.name} ({lang.label})</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Initializing...' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

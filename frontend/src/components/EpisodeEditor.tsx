import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Eye } from 'lucide-react';
import { Episode } from '../types';

interface EpisodeEditorProps {
  episode: Episode;
  onSaveContent: (title: string, content: string) => Promise<void>;
  onLaunchWizard: () => void;
  onViewFinalized: () => void;
}

export const EpisodeEditor: React.FC<EpisodeEditorProps> = ({
  episode,
  onSaveContent,
  onLaunchWizard,
  onViewFinalized,
}) => {
  const [title, setTitle] = useState(episode.title);
  const [content, setContent] = useState(episode.content);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setTitle(episode.title);
    setContent(episode.content);
    setHasUnsavedChanges(false);
  }, [episode.id, episode.title, episode.content]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveContent(title, content);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving episode content:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchWizardClick = async () => {
    // Automatically save unsaved changes before launching the wizard!
    if (hasUnsavedChanges || title !== episode.title || content !== episode.content) {
      setSaving(true);
      try {
        await onSaveContent(title, content);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Error auto-saving content before launching wizard:', err);
      } finally {
        setSaving(false);
      }
    }
    onLaunchWizard();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        background: 'var(--bg-panel)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ flex: 1, marginRight: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Episode {episode.episode_number}</span>
            <span className={`badge-pill badge-${episode.status}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
              <span className="badge-dot" />
              {episode.status}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Episode Title..."
            style={{
              fontSize: '1.2rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid transparent',
              padding: '0.15rem 0',
              color: 'var(--ink-primary)',
              width: '100%',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handleSave} disabled={saving} style={{ fontSize: '0.75rem' }}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>

          {episode.status === 'finalized' && (
            <button className="btn btn-secondary" onClick={onViewFinalized} style={{ fontSize: '0.75rem' }}>
              <Eye size={14} />
              View
            </button>
          )}

          <button className="btn btn-primary" onClick={handleLaunchWizardClick} disabled={saving} style={{ fontSize: '0.75rem' }}>
            <Sparkles size={14} />
            AI Analysis
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '1.25rem',
        background: 'var(--bg-panel)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        minHeight: '480px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.65rem',
          fontSize: '0.68rem', color: 'var(--ink-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
        }}>
          <span>Draft Script</span>
          <span>{wordCount} words · {charCount} chars</span>
        </div>

        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Write or paste your episode script here..."
          style={{
            flex: 1,
            width: '100%',
            minHeight: '400px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: 'var(--ink-primary)',
          }}
        />

        <div style={{
          marginTop: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.72rem', color: 'var(--ink-dim)',
        }}>
          <span>
            {hasUnsavedChanges
              ? <span style={{ color: 'var(--accent-amber)' }}>● Unsaved changes</span>
              : <span style={{ color: 'var(--accent-red)' }}>✓ Saved</span>
            }
          </span>
          <span>
            Run AI Analysis to check plot continuity against Episode {Math.max(1, episode.episode_number - 1)}
          </span>
        </div>
      </div>
    </main>
  );
};

import React, { useState } from 'react';
import { Save, CheckCircle, ArrowRight } from 'lucide-react';

interface Step4SaveProps {
  loading: boolean;
  finalContent: string;
  onSave: (finalContent: string) => Promise<void>;
}

export const Step4Save: React.FC<Step4SaveProps> = ({
  loading,
  finalContent: initialFinalContent,
  onSave,
}) => {
  const [content, setContent] = useState<string>(initialFinalContent);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
      {/* Header & Status Change Preview */}
      <div className="panel panel-accent" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-red)' }}>STEP 4 — SAVE & FINALIZE EPISODE</div>
            <h3 style={{ fontSize: '1.15rem', margin: '0.2rem 0 0' }}>
              PERSIST REFINED EPISODE TO SERIES TIMELINE
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge-pill badge-draft">Draft</span>
            <ArrowRight size={14} color="var(--ink-muted)" />
            <span className="badge-pill badge-finalized">Finalized</span>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
          Review the refined text below. All accepted continuity corrections, grammar fixes, and tone adjustments have been merged into this final manuscript.
        </p>
      </div>

      {/* Manuscript Review Area */}
      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--ink-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span>Final Script Manuscript</span>
          <span>{wordCount} Words &bull; {charCount} Characters</span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            flex: 1,
            width: '100%',
            minHeight: '280px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            color: 'var(--ink-primary)',
          }}
        />
      </div>

      {/* Final Save Action Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => onSave(content)}
          disabled={loading}
          style={{ padding: '0.85rem 2.25rem', fontSize: '0.9rem', boxShadow: 'var(--shadow-glow)' }}
        >
          <CheckCircle size={18} />
          {loading ? 'Finalizing & Saving...' : 'FINALIZE & SAVE EPISODE'}
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { GrammarIssue } from '../../types';
import { Check, ArrowRight, FileCheck } from 'lucide-react';

import { AgenticTelemetryHud } from '../AgenticTelemetryHud';

interface Step2GrammarProps {
  loading: boolean;
  grammarIssues: GrammarIssue[];
  initialContent: string;
  onContinue: (updatedContent: string) => void;
}

export const Step2Grammar: React.FC<Step2GrammarProps> = ({
  loading,
  grammarIssues,
  initialContent,
  onContinue,
}) => {
  const [issues, setIssues] = useState<GrammarIssue[]>([]);

  useEffect(() => {
    setIssues(grammarIssues.map(g => ({ ...g, accepted: false })));
  }, [grammarIssues]);

  const toggleAccept = (id: string) => {
    setIssues(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, accepted: !item.accepted };
        }
        return item;
      })
    );
  };

  const getRefinedContent = () => {
    let text = initialContent;
    issues.forEach(iss => {
      if (iss.accepted && iss.snippet && iss.suggested_fix) {
        if (text.includes(iss.snippet)) {
          text = text.replace(iss.snippet, iss.suggested_fix);
        }
      }
    });
    return text;
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem 0' }}>
        <AgenticTelemetryHud
          jobId="grammar-job"
          title="OPENAI GPT-4O-MINI DIALOGUE & PACING COPYEDIT PASS"
          defaultSubstep="GPT-4o-mini"
        />
      </div>
    );
  }

  const acceptedCount = issues.filter(i => i.accepted).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
      {/* Step Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">STEP 2 — GRAMMAR & STYLE PASS</div>
          <h3 style={{ fontSize: '1.1rem', margin: '0.2rem 0 0' }}>
            SURFACED GRAMMAR & PACING ISSUES ({issues.length})
          </h3>
        </div>

        <div style={{
          background: 'var(--bg-panel-elevated)',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-accent)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--accent-red)',
        }}>
          {acceptedCount} of {issues.length} Corrections Accepted
        </div>
      </div>

      {/* Grammar Cards Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
        {issues.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-muted)' }}>
            <FileCheck size={36} color="var(--accent-red)" style={{ marginBottom: '0.5rem' }} />
            <p>Clean Copy! No major grammar or style issues detected in this pass.</p>
          </div>
        ) : (
          issues.map((iss, index) => (
            <div
              key={iss.id || index}
              className="panel"
              style={{
                padding: '1rem 1.25rem',
                borderColor: iss.accepted ? 'var(--accent-red)' : 'var(--border-subtle)',
                background: iss.accepted ? 'rgba(217, 30, 54, 0.08)' : 'var(--bg-panel)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--ink-muted)',
                      letterSpacing: '0.08em',
                    }}>
                      ISSUE #{index + 1}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-primary)', fontWeight: 500 }}>
                      {iss.issue}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ color: 'var(--accent-red)', textDecoration: 'line-through' }}>
                      "{iss.snippet}"
                    </span>
                    <ArrowRight size={14} color="var(--ink-dim)" />
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                      "{iss.suggested_fix}"
                    </span>
                  </div>
                </div>

                <button
                  className={iss.accepted ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => toggleAccept(iss.id)}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  {iss.accepted ? (
                    <>
                      <Check size={14} /> Applied
                    </>
                  ) : (
                    'Accept Correction'
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          className="btn btn-primary"
          onClick={() => onContinue(getRefinedContent())}
          style={{ padding: '0.75rem 1.75rem' }}
        >
          Continue to Step 3: Tone Remix
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

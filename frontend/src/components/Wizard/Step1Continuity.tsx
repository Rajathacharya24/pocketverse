import React, { useState, useEffect } from 'react';
import { ContinuityResult, ContinuityIssue, Episode } from '../../types';
import { ShieldCheck, ArrowRight, RefreshCw, Check, Edit3, X, Save } from 'lucide-react';
import { fetchEpisodeById, updateEpisode } from '../../api/client';
import { AgenticTelemetryHud } from '../AgenticTelemetryHud';

interface Step1ContinuityProps {
  loading: boolean;
  result: ContinuityResult | null;
  initialContent: string;
  onReRun: () => void;
  onContinue: (updatedContent: string) => void;
}

export const Step1Continuity: React.FC<Step1ContinuityProps> = ({
  loading,
  result,
  initialContent,
  onReRun,
  onContinue,
}) => {
  const [issues, setIssues] = useState<ContinuityIssue[]>([]);

  // Previous Episode Editing Modal State
  const [isEditingPrevious, setIsEditingPrevious] = useState<boolean>(false);
  const [previousEpisodeData, setPreviousEpisodeData] = useState<Episode | null>(null);
  const [prevTitle, setPrevTitle] = useState<string>('');
  const [prevContent, setPrevContent] = useState<string>('');
  const [savingPrev, setSavingPrev] = useState<boolean>(false);
  const [prevSavedMsg, setPrevSavedMsg] = useState<string>('');

  useEffect(() => {
    if (result && result.issues) {
      setIssues(result.issues.map(iss => ({ ...iss, accepted: false })));
    }
  }, [result]);

  const handleOpenEditPrevious = async () => {
    if (!result?.matched_against_episode_id) return;
    setIsEditingPrevious(true);
    setPrevSavedMsg('');
    try {
      const ep = await fetchEpisodeById(result.matched_against_episode_id);
      setPreviousEpisodeData(ep);
      setPrevTitle(ep.title);
      setPrevContent(ep.content);
    } catch (err) {
      console.error('Error fetching previous episode for editing:', err);
    }
  };

  const handleSavePreviousEpisode = async () => {
    if (!previousEpisodeData) return;
    setSavingPrev(true);
    setPrevSavedMsg('');
    try {
      await updateEpisode(previousEpisodeData.id, { title: prevTitle, content: prevContent });
      setPrevSavedMsg('✓ Previous episode updated successfully! Re-running continuity check...');
      setTimeout(() => {
        setIsEditingPrevious(false);
        onReRun();
      }, 1200);
    } catch (err) {
      console.error('Error saving previous episode:', err);
    } finally {
      setSavingPrev(false);
    }
  };

  const toggleAcceptIssue = (issueId: string) => {
    setIssues(prev =>
      prev.map(iss => {
        if (iss.id === issueId) {
          const nextAccepted = !iss.accepted;
          return { ...iss, accepted: nextAccepted };
        }
        return iss;
      })
    );
  };

  // Clean, precise text refinement without appending raw bracket strings
  const getRefinedContent = () => {
    let text = initialContent;
    issues.forEach(iss => {
      if (iss.accepted && iss.suggestion) {
        if (iss.snippet && text.includes(iss.snippet)) {
          text = text.replace(iss.snippet, iss.suggestion);
        }
      }
    });
    return text;
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem 0' }}>
        <AgenticTelemetryHud
          jobId={result?.matched_against_episode_id || 'continuity-job'}
          title="OPENAI GPT-4O CONTINUITY & CHARACTER VOICE PASS"
          defaultSubstep="GPT-4o Agent"
        />
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--ink-muted)' }}>No continuity diagnostic results available.</p>
        <button className="btn btn-primary" onClick={onReRun} style={{ marginTop: '1rem' }}>
          <RefreshCw size={16} /> Run Analysis
        </button>
      </div>
    );
  }

  const acceptedCount = issues.filter(i => i.accepted).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
      {/* Top Banner: Previous Episode Context & Hook Rating */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
      }}>
        {/* Context Match Card */}
        <div className="panel panel-accent" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ fontSize: '0.65rem' }}>Series Continuity Benchmark</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {result.matched_against_episode_id
                ? `Matched Against: Episode ${result.matched_against_episode_title ? `"${result.matched_against_episode_title}"` : 'N-1'}`
                : 'Episode 1: Standalone Pilot Check'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              {result.matched_against_episode_id
                ? 'Verified characters, timeline, and inventory carried over from previous episode.'
                : 'Verified pilot narrative setup and internal logic.'}
            </p>
          </div>

          {result.matched_against_episode_id && (
            <button
              className="btn btn-secondary"
              onClick={handleOpenEditPrevious}
              style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem', alignSelf: 'flex-start' }}
            >
              <Edit3 size={13} /> Edit Previous Episode Script
            </button>
          )}
        </div>

        {/* Hook Evaluation Card */}
        <div className="panel" style={{
          padding: '1rem 1.25rem',
          borderColor: result.hook_check.score >= 7 ? 'var(--border-subtle)' : 'var(--accent-red-dim)',
          background: result.hook_check.score < 7 ? 'rgba(217, 30, 54, 0.05)' : 'var(--bg-panel)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Ending Cliffhanger Rating</span>
            <span className={`badge-pill ${result.hook_check.score >= 8 ? 'badge-finalized' : 'badge-analyzed'}`}>
              Score: {result.hook_check.score}/10 ({result.hook_check.status})
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-primary)', marginTop: '0.4rem' }}>
            {result.hook_check.review}
          </p>
          {result.hook_check.suggestion && (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.35rem' }}>
              💡 Master Editor Suggestion: {result.hook_check.suggestion}
            </div>
          )}
        </div>
      </div>

      {/* Issues Review Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>
            DISCOVERED CONTINUITY FINDINGS ({issues.length})
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
            Review findings by 20+ yr veteran editor. Click "Accept Suggestion" to apply proposed fix.
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-red)' }}>
          {acceptedCount} of {issues.length} Suggestions Accepted
        </div>
      </div>

      {/* Issues List Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '340px', overflowY: 'auto' }}>
        {issues.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-muted)' }}>
            <ShieldCheck size={32} color="var(--accent-red)" style={{ marginBottom: '0.5rem' }} />
            <p>Clean Continuity! No plot holes or timeline contradictions detected.</p>
          </div>
        ) : (
          issues.map((iss) => (
            <div
              key={iss.id}
              className="panel"
              style={{
                borderColor: iss.accepted ? 'var(--accent-red)' : 'var(--border-subtle)',
                background: iss.accepted ? 'rgba(217, 30, 54, 0.08)' : 'var(--bg-panel)',
                padding: '1.25rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-pill)',
                    background: iss.severity === 'critical' ? 'var(--accent-red)' : 'rgba(217, 119, 6, 0.2)',
                    color: iss.severity === 'critical' ? '#FFF' : 'var(--accent-amber)',
                  }}>
                    {iss.severity}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{iss.title}</span>
                </div>

                <button
                  className={iss.accepted ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => toggleAcceptIssue(iss.id)}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                >
                  {iss.accepted ? (
                    <>
                      <Check size={14} /> Accepted
                    </>
                  ) : (
                    'Accept Suggestion'
                  )}
                </button>
              </div>

              {iss.snippet && (
                <div style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem',
                  color: 'var(--ink-muted)',
                  borderLeft: '2px solid var(--accent-red-dim)',
                }}>
                  "{iss.snippet}"
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--ink-primary)', marginBottom: '0.5rem' }}>
                {iss.description}
              </p>

              {iss.suggestion && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-red)',
                  background: 'var(--accent-red-subtle)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-red-dim)',
                }}>
                  <strong>Master Editor Suggested Fix:</strong> {iss.suggestion}
                </div>
              )}
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
          Continue to Step 2: Grammar Layer
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Edit Previous Episode Modal */}
      {isEditingPrevious && (
        <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setIsEditingPrevious(false)}>
          <div className="modal-card" style={{ maxWidth: '750px', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Edit3 className="accent-text" size={22} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit Previous Episode Manuscript</h3>
              </div>
              <button className="btn-outline" onClick={() => setIsEditingPrevious(false)} style={{ padding: '0.4rem', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {prevSavedMsg && (
              <div style={{ background: 'rgba(217, 30, 54, 0.08)', color: 'var(--accent-red)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {prevSavedMsg}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '0.4rem' }}>Previous Episode Title</label>
              <input type="text" value={prevTitle} onChange={e => setPrevTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '0.4rem' }}>Previous Episode Content Body</label>
              <textarea
                value={prevContent}
                onChange={e => setPrevContent(e.target.value)}
                style={{ minHeight: '260px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setIsEditingPrevious(false)} disabled={savingPrev}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSavePreviousEpisode} disabled={savingPrev}>
                <Save size={16} />
                {savingPrev ? 'Saving Changes...' : 'Save & Re-run Continuity Check'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

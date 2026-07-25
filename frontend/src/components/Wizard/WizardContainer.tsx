import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Layers, Cpu } from 'lucide-react';
import { Episode, AnalysisRun, ContinuityResult, GrammarIssue, ToneRemixResult } from '../../types';
import { Step1Continuity } from './Step1Continuity';
import { Step2Grammar } from './Step2Grammar';
import { Step3ToneRemix } from './Step3ToneRemix';
import { Step4Save } from './Step4Save';
import { runContinuityAnalysis, runGrammarAnalysis, runToneRemix, saveAnalysis } from '../../api/client';

interface WizardContainerProps {
  episode: Episode;
  initialStep?: number;
  onClose: () => void;
  onComplete: () => Promise<void>;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  episode,
  initialStep = 1,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [workingContent, setWorkingContent] = useState<string>(episode.content);
  
  // Pipeline State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Diagnostic Results
  const [continuityResult, setContinuityResult] = useState<ContinuityResult | null>(null);
  const [grammarResult, setGrammarResult] = useState<GrammarIssue[] | null>(null);
  const [toneResult, setToneResult] = useState<ToneRemixResult | null>(null);

  // Trigger Step 1 on initial wizard load
  React.useEffect(() => {
    handleRunStep1();
  }, [episode.id]);

  const handleRunStep1 = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await runContinuityAnalysis(episode.id);
      setContinuityResult(data.continuity_result);
    } catch (err: any) {
      setError(err.message || 'Failed to complete Continuity & Story-Hole check.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceToStep2 = async (updatedContentFromStep1: string) => {
    setWorkingContent(updatedContentFromStep1);
    setCurrentStep(2);
    setLoading(true);
    setError('');
    try {
      const data = await runGrammarAnalysis(episode.id, updatedContentFromStep1);
      setGrammarResult(data.grammar_result);
    } catch (err: any) {
      setError(err.message || 'Failed to complete Grammar Layer scan.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceToStep3 = async (updatedContentFromStep2: string) => {
    setWorkingContent(updatedContentFromStep2);
    setCurrentStep(3);
  };

  const handleRunToneRemix = async (category: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await runToneRemix(episode.id, category, workingContent);
      setToneResult(data.tone_remix_result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Tone Remix.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceToStep4 = (updatedContentFromStep3: string) => {
    setWorkingContent(updatedContentFromStep3);
    setCurrentStep(4);
  };

  const handleFinalSave = async (finalContent: string) => {
    setLoading(true);
    setError('');
    try {
      await saveAnalysis(episode.id, finalContent);
      await onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to finalize and save episode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ padding: '1rem', overflowY: 'auto' }}>
      <div style={{
        background: 'var(--bg-void)',
        border: '1px solid var(--border-accent-strong)',
        boxShadow: '0 0 50px rgba(217, 30, 54, 0.3)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '1100px',
        minHeight: '680px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Diagnostic Stepper Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-accent)',
          background: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <Sparkles size={18} color="#FFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>AI CONTINUITY & REVIEW PIPELINE</h2>
                <span className="badge-pill badge-finalized" style={{ fontSize: '0.65rem' }}>
                  <Cpu size={12} /> OpenAI GPT-4o Active
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                Episode {episode.episode_number}: "{episode.title}"
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-outline" style={{ border: 'none', padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper Steps Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--bg-panel-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {[
            { num: 1, label: 'CONTINUITY & HOOK', desc: 'Plot Holes & Flow' },
            { num: 2, label: 'GRAMMAR LAYER', desc: 'Snippet Corrections' },
            { num: 3, label: 'TONE REMIX', desc: 'Genre Adaptation' },
            { num: 4, label: 'SAVE & PUBLISH', desc: 'Final Persist' },
          ].map((step) => {
            const isActive = currentStep === step.num;
            const isDone = currentStep > step.num;
            return (
              <div
                key={step.num}
                style={{
                  padding: '0.9rem 1rem',
                  borderBottom: `2px solid ${isActive ? 'var(--accent-red)' : isDone ? 'var(--ink-dim)' : 'transparent'}`,
                  background: isActive ? 'rgba(217, 30, 54, 0.08)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isActive ? 'var(--accent-red)' : isDone ? 'var(--bg-panel-hover)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent-red)' : isDone ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
                  color: isActive ? '#FFF' : isDone ? 'var(--ink-muted)' : 'var(--ink-dim)',
                }}>
                  {isDone ? <CheckCircle2 size={14} color="var(--accent-red)" /> : step.num}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isActive ? 'var(--ink-primary)' : 'var(--ink-muted)',
                    letterSpacing: '0.08em',
                  }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--ink-dim)' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wizard Main Content Container */}
        <div style={{ flex: 1, padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          {error && (
            <div style={{
              background: 'rgba(217, 30, 54, 0.15)',
              border: '1px solid var(--accent-red-dim)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              color: 'var(--accent-red)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <Step1Continuity
              loading={loading}
              result={continuityResult}
              initialContent={workingContent}
              onReRun={handleRunStep1}
              onContinue={handleAdvanceToStep2}
            />
          )}

          {currentStep === 2 && (
            <Step2Grammar
              loading={loading}
              grammarIssues={grammarResult || []}
              initialContent={workingContent}
              onContinue={handleAdvanceToStep3}
            />
          )}

          {currentStep === 3 && (
            <Step3ToneRemix
              loading={loading}
              toneResult={toneResult}
              initialContent={workingContent}
              onRunRemix={handleRunToneRemix}
              onContinue={handleAdvanceToStep4}
            />
          )}

          {currentStep === 4 && (
            <Step4Save
              loading={loading}
              finalContent={workingContent}
              onSave={handleFinalSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};

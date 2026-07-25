import React, { useState } from 'react';
import { ToneRemixResult } from '../../types';
import { Wand2, Check, ArrowRight, FastForward } from 'lucide-react';
import { AgenticTelemetryHud } from '../AgenticTelemetryHud';

interface Step3ToneRemixProps {
  loading: boolean;
  toneResult: ToneRemixResult | null;
  initialContent: string;
  onRunRemix: (category: string) => void;
  onContinue: (updatedContent: string) => void;
}

const CATEGORIES = ['Noir', 'Horror', 'Funny', 'Drama', 'Sci-Fi'];

export const Step3ToneRemix: React.FC<Step3ToneRemixProps> = ({
  loading,
  toneResult,
  initialContent,
  onRunRemix,
  onContinue,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Noir');
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setIsAccepted(false);
    onRunRemix(cat);
  };

  const getActiveContent = () => {
    if (isAccepted && toneResult?.remixed_content) {
      return toneResult.remixed_content;
    }
    return initialContent;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
      {/* Category Picker Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <div className="eyebrow">STEP 3 — OPTIONAL TONE & GENRE REMIX</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0.2rem 0 0' }}>
              REGENERATE ATMOSPHERE WHILE PRESERVING CONTINUITY
            </h3>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => onContinue(initialContent)}
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
          >
            <FastForward size={14} /> Skip Tone Remix
          </button>
        </div>

        {/* Genre Category Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat && toneResult ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => handleSelectCategory(cat)}
              disabled={loading}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem' }}
            >
              <Wand2 size={13} /> {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Surface */}
      {loading ? (
        <div style={{ padding: '1rem 0' }}>
          <AgenticTelemetryHud
            jobId="tone-job"
            title={`OPENAI GPT-4O ${selectedCategory.toUpperCase()} ATMOSPHERE REMIX PASS`}
            defaultSubstep="GPT-4o Agent"
          />
        </div>
      ) : toneResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {/* Genre Adaptation Summary Banner */}
          <div className="panel panel-accent" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="eyebrow">Genre Transformation Summary ({toneResult.category})</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-primary)', margin: '0.2rem 0 0' }}>
                {toneResult.summary}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={isAccepted ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setIsAccepted(!isAccepted)}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
              >
                {isAccepted ? <><Check size={14} /> Remixed Version Accepted</> : 'Accept Remixed Version'}
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            flex: 1,
            maxHeight: '340px',
          }}>
            {/* Left Panel: Original / Step 2 Version */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
              <div className="eyebrow" style={{ marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
                Original Content (Prior Steps)
              </div>
              <textarea
                readOnly
                value={toneResult.original_content}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-muted)',
                }}
              />
            </div>

            {/* Right Panel: Remixed Version */}
            <div className="panel" style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '1rem',
              borderColor: isAccepted ? 'var(--accent-red)' : 'var(--border-accent)',
              boxShadow: isAccepted ? '0 0 20px rgba(217, 30, 54, 0.2)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div className="eyebrow" style={{ color: 'var(--accent-red)' }}>
                  {toneResult.category} Remixed Version
                </div>
                {isAccepted && (
                  <span className="badge-pill badge-finalized" style={{ fontSize: '0.6rem' }}>
                    Active Choice
                  </span>
                )}
              </div>
              <textarea
                readOnly
                value={toneResult.remixed_content}
                style={{
                  flex: 1,
                  background: 'rgba(217, 30, 54, 0.05)',
                  border: '1px solid var(--border-accent)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-primary)',
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Prompt user to pick a category */
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem', flex: 1 }}>
          <Wand2 size={36} className="accent-text" style={{ marginBottom: '0.5rem' }} />
          <h3 className="heading-grotesk" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            SELECT A GENRE CATEGORY ABOVE
          </h3>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Choose a genre (Noir, Horror, Funny, Drama, Sci-Fi) to generate an atmospheric side-by-side remix preview, or click "Skip Tone Remix".
          </p>
        </div>
      )}

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          className="btn btn-primary"
          onClick={() => onContinue(getActiveContent())}
          style={{ padding: '0.75rem 1.75rem' }}
        >
          Continue to Step 4: Save & Publish
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

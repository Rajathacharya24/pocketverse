import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Sparkles, Mic, UploadCloud, Terminal, Zap, ArrowRight, Headphones } from 'lucide-react';
import { HeroVisual } from './HeroVisual';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

const TERMINAL_LINES = [
  { icon: '⚡', text: 'Initializing AI Production Engine...', color: 'var(--accent-violet)' },
  { icon: '🎙', text: 'Synthesizing OpenAI Male Voice (Onyx Baritone)...', color: 'var(--accent-cyan)' },
  { icon: '🔊', text: 'Synthesizing Ambient Soundscape Bed...', color: 'var(--accent-cyan)' },
  { icon: '🎛', text: 'ffmpeg Mixing Master Audio Track...', color: 'var(--accent-indigo)' },
  { icon: '✨', text: 'Episode ready.', color: 'var(--success)' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const [terminalLines, setTerminalLines] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setTerminalLines(TERMINAL_LINES.length);
      return;
    }
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      setTerminalLines(currentIndex);
      if (currentIndex >= TERMINAL_LINES.length) clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--void)',
      color: 'var(--text-main)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="scan-line" aria-hidden="true" />

      <style>{`
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6, 6, 10, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .lp-nav-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.02em;
          color: var(--text-main);
        }
        .lp-nav-brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent-violet), var(--accent-indigo));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .lp-nav-link {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .lp-nav-link:hover {
          color: var(--text-main);
        }
        .lp-cta-nav {
          background: linear-gradient(135deg, var(--accent-violet), var(--accent-indigo));
          color: white;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.55rem 1.2rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          letter-spacing: 0.02em;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .lp-cta-nav:hover {
          box-shadow: 0 0 24px rgba(139, 92, 246, 0.4);
          transform: translateY(-1px);
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8rem 1.5rem 4rem;
          text-align: center;
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 900px) {
          .hero-section {
            flex-direction: row;
            text-align: left;
            align-items: center;
            justify-content: space-between;
            padding: 8rem 2rem 5rem;
            gap: 2rem;
          }
          .hero-content { flex: 1; min-width: 0; }
          .hero-visual-wrap { flex: 0 0 440px; max-width: 440px; }
        }
        @media (max-width: 899px) {
          .hero-visual-wrap {
            order: -1;
            max-width: 260px;
            width: 100%;
          }
          .hero-visual { max-width: 260px; }
        }

        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: var(--accent-violet);
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
          animation: reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .lp-headline {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 5.5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 1.25rem;
          animation: reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }

        .lp-sub {
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
          max-width: 520px;
          line-height: 1.65;
          animation: reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          opacity: 0;
        }

        .lp-btn-group {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          animation: reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          opacity: 0;
        }

        .lp-btn-primary {
          background: linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-indigo) 100%);
          color: white;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.03em;
          padding: 0.8rem 1.8rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .lp-btn-primary:hover {
          box-shadow: 0 0 35px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .lp-btn-secondary {
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 0.8rem 1.6rem;
          border-radius: 10px;
          border: 1px solid var(--border-strong);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .lp-btn-secondary:hover {
          background: rgba(255,255,255,0.07);
          border-color: var(--text-muted);
          color: var(--text-main);
        }

        .stats-row {
          display: flex;
          gap: 2.5rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          animation: reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .stat-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .crew-section {
          background: var(--panel);
          border-top: 1px solid var(--border);
          padding: 6rem 1.5rem;
          width: 100%;
        }
        .crew-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-top: 3rem;
        }
        @media (min-width: 600px) {
          .crew-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 960px) {
          .crew-grid { grid-template-columns: repeat(5, 1fr); }
        }

        .crew-card {
          background: var(--panel-subtle);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .crew-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent-violet), var(--accent-cyan));
          opacity: 0;
          transition: opacity 0.25s;
        }
        .crew-card:hover {
          border-color: var(--accent-violet);
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.08);
          transform: translateY(-3px);
        }
        .crew-card:hover::before { opacity: 1; }
        .crew-card:focus-visible {
          outline: 2px solid var(--accent-violet);
          outline-offset: 2px;
        }

        .crew-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .crew-card:hover .crew-icon { transform: scale(1.05); }

        .terminal-box {
          background: var(--panel-subtle);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0;
          box-shadow: var(--shadow-panel);
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          overflow: hidden;
          position: relative;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
        }
        .terminal-dots {
          display: flex;
          gap: 5px;
        }
        .terminal-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--elevated-3);
        }
        .terminal-body {
          padding: 1.25rem;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          line-height: 1.8;
          min-height: 180px;
        }
        .terminal-line {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.6;
        }
        .terminal-cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: var(--accent-violet);
          border-radius: 1px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .terminal-cursor { animation: none; opacity: 1; } }
      `}</style>

      {/* Navigation */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <div className="lp-nav-brand-icon">
            <Headphones size={16} />
          </div>
          PocketVerse
        </div>
        <div className="lp-nav-links">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI Production Studio</span>
          <button className="lp-cta-nav" onClick={onEnterDashboard}>
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="lp-badge">
            <Zap size={12} /> Now powered by OpenAI GPT-4o
          </div>

          <h1 className="lp-headline">
            Your entire audio production crew —{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              automated.
            </span>
          </h1>

          <p className="lp-sub">
            One script in. Five AI specialists — continuity editor, copyeditor, genre director, voice director, publisher — out. From draft to mastered audio in minutes, not weeks.
          </p>

          <div className="lp-btn-group">
            <button className="lp-btn-primary" onClick={onEnterDashboard}>
              Launch Studio <ArrowRight size={16} />
            </button>
            <button className="lp-btn-secondary" onClick={onEnterDashboard}>
              See how it works
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--accent-violet)' }}>5</div>
              <div className="stat-label">AI Specialists</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>1</div>
              <div className="stat-label">Click to Publish</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--accent-indigo)' }}>&lt;60s</div>
              <div className="stat-label">Full Pipeline</div>
            </div>
          </div>
        </div>

        <div className="hero-visual-wrap">
          <HeroVisual reducedMotion={reducedMotion} />
        </div>
      </section>

      {/* Terminal */}
      <section style={{ width: '100%', padding: '0 1.5rem 5rem' }}>
        <div className="terminal-box">
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={13} color="var(--accent-violet)" />
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
              }}>
                Live Pipeline Output
              </span>
            </div>
            <div className="terminal-dots">
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <div className="terminal-dot" />
            </div>
          </div>

          <div className="terminal-body">
            {TERMINAL_LINES.slice(0, terminalLines).map((line, idx) => (
              <div key={idx} className="terminal-line">
                <span style={{ color: line.color, flexShrink: 0 }}>{line.icon}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{line.text}</span>
              </div>
            ))}
            {terminalLines < TERMINAL_LINES.length && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>...</span>
                <span className="terminal-cursor" />
              </div>
            )}
            {terminalLines >= TERMINAL_LINES.length && (
              <div style={{ marginTop: '0.5rem', color: 'var(--accent-violet)', opacity: 0.6, fontSize: '0.7rem' }}>
                ─── End of stream ───
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Crew */}
      <section className="crew-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span className="eyebrow" style={{ color: 'var(--accent-violet)', fontSize: '0.72rem' }}>
              The Production Pipeline
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginTop: '0.5rem',
              color: 'var(--text-main)',
            }}>
              Five specialists. Zero compromise.
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              maxWidth: '500px',
              margin: '0.75rem auto 0',
              lineHeight: 1.6,
            }}>
              Each episode passes through every AI crew member in sequence — catching issues that solo tools miss.
            </p>
          </div>

          <div className="crew-grid stagger-reveal">
            {[
              {
                num: '01',
                role: 'Continuity Editor',
                desc: 'Catches plot holes & timeline breaks against the previous episode.',
                icon: <FileText size={18} />,
                color: 'var(--accent-violet)',
                bg: 'var(--accent-violet-dim)',
              },
              {
                num: '02',
                role: 'Copyeditor',
                desc: 'Grammar & dialogue-cadence polish pass.',
                icon: <CheckCircle size={18} />,
                color: 'var(--accent-cyan)',
                bg: 'var(--accent-cyan-dim)',
              },
              {
                num: '03',
                role: 'Genre Director',
                desc: 'Remixes tone (Noir/Horror/Funny/Drama/Sci-Fi) while preserving plot and character.',
                icon: <Sparkles size={18} />,
                color: 'var(--accent-indigo)',
                bg: 'var(--accent-indigo-dim)',
              },
              {
                num: '04',
                role: 'Voice Director',
                desc: 'Renders a tone-matched narrator voice with a mixed ambience bed.',
                icon: <Mic size={18} />,
                color: 'var(--accent-cyan)',
                bg: 'var(--accent-cyan-dim)',
              },
              {
                num: '05',
                role: 'Publisher',
                desc: 'The explicit, deliberate step that ships an episode to production.',
                icon: <UploadCloud size={18} />,
                color: 'var(--accent-violet)',
                bg: 'var(--accent-violet-dim)',
              },
            ].map(m => (
              <div
                tabIndex={0}
                key={m.num}
                className="crew-card"
                onClick={onEnterDashboard}
                onKeyDown={(e) => { if (e.key === 'Enter') onEnterDashboard(); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="crew-icon" style={{ backgroundColor: m.bg, color: m.color }}>
                    {m.icon}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--text-dim)',
                    fontWeight: 600,
                  }}>{m.num}</span>
                </div>

                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '0.9rem',
                    color: 'var(--text-main)',
                    marginBottom: '0.35rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}>
                    {m.role}
                  </h3>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.55,
                    margin: 0,
                  }}>
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
        background: 'var(--void-deep)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '0.75rem',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-indigo))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Headphones size={12} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-main)',
          }}>
            PocketVerse
          </span>
        </div>
        <div style={{
          color: 'var(--text-dim)',
          fontSize: '0.72rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
        }}>
          Pocket FM x OpenAI — Zero to One Hackathon
        </div>
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Sparkles, Mic, UploadCloud, Terminal, Zap } from 'lucide-react';
import { HeroVisual } from './HeroVisual';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

const TERMINAL_LINES = [
  "⚡ Initializing AI Production Engine...",
  "🎙️ Synthesizing OpenAI Male Voice (Onyx Baritone)...",
  "🔊 Synthesizing Wind Breeze Soundscape Bed...",
  "🎛️ ffmpeg-static Mixing Master Audio Track...",
  "✨ Episode ready."
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    if (mq.matches) {
      setTerminalLines(TERMINAL_LINES);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      setTerminalLines(TERMINAL_LINES.slice(0, currentIndex + 1));
      currentIndex++;
      if (currentIndex >= TERMINAL_LINES.length) {
        clearInterval(interval);
      }
    }, 700);
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
    }}>
      {/* Scan line atmosphere */}
      <div className="scan-line" aria-hidden="true" />

      <style>{`
        .landing-header {
          font-family: var(--font-headline);
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .landing-btn {
          background-color: var(--primary);
          color: var(--text-main);
          font-family: var(--font-body);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.85rem 1.75rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 15px rgba(217, 30, 54, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        .landing-btn:hover {
          background-color: var(--primary-hover);
          box-shadow: 0 0 25px rgba(217, 30, 54, 0.6);
          transform: translateY(-1px);
        }
        .landing-btn:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 3px;
        }

        .crew-card {
          background-color: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .crew-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 20px rgba(217, 30, 54, 0.15);
          transform: translateY(-2px);
        }
        .crew-card:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: var(--success);
          vertical-align: middle;
          margin-left: 4px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .terminal-cursor { animation: none; opacity: 1; } }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 1.5rem;
          text-align: center;
          gap: 2rem;
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
            padding: 6rem 2rem;
            gap: 3rem;
          }
          .hero-content {
            flex: 1;
            min-width: 0;
          }
          .hero-visual-wrap {
            flex: 0 0 420px;
            max-width: 420px;
          }
        }
        @media (max-width: 899px) {
          .hero-visual-wrap {
            order: -1;
            max-width: 280px;
            width: 100%;
          }
          .hero-visual {
            max-width: 280px;
          }
        }

        .crew-section {
          background-color: var(--panel);
          border-top: 1px solid var(--border);
          padding: 5rem 1.5rem;
          width: 100%;
        }
        .crew-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }
        @media (min-width: 600px) {
          .crew-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 960px) {
          .crew-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        .crew-num {
          font-family: var(--font-headline);
          font-size: 1rem;
          color: var(--text-muted-2);
          font-weight: 700;
        }
      `}</style>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em'
          }}>
            <Zap size={14} /> POCKET FM HACKATHON PROJECT
          </div>

          <h1 className="landing-header" style={{
            fontSize: 'clamp(2rem, 5.5vw, 3.25rem)',
            color: 'var(--text-main)',
            marginBottom: '1.25rem',
            fontWeight: 800,
            lineHeight: 1.05
          }}>
            One platform replaces a five-person production team.
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--ink-secondary)',
            marginBottom: '2.5rem',
            maxWidth: '560px',
            lineHeight: 1.6
          }}>
            Catch plot holes before you publish. PocketVerse runs your script through a continuity editor, copyeditor, genre director, voice director, and publisher in seconds.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', justifySelf: 'start' }}>
            <button className="landing-btn" onClick={onEnterDashboard}>
              Enter Dashboard
            </button>
          </div>
        </div>

        {/* Hero Visual — Duotone + Particles */}
        <div className="hero-visual-wrap">
          <HeroVisual reducedMotion={reducedMotion} />
        </div>
      </section>

      {/* Terminal Preview — below hero */}
      <section style={{
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        padding: '0 1.5rem 4rem',
      }}>
        <div style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-panel)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '200px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem'
        }}>
          {/* Terminal Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
            color: 'var(--ink-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Terminal size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live Telemetry HUD
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border)' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border)' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border)' }} />
            </div>
          </div>

          {/* Terminal Content Logs */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            color: 'var(--success)'
          }}>
            {terminalLines.map((line, idx) => (
              <div key={idx} style={{ lineHeight: 1.4 }}>
                {line.startsWith('⚡') && <span style={{ color: 'var(--primary)' }}>{line.slice(0, 1)}</span>}
                {line.startsWith('🎙️') && <span style={{ color: 'var(--secondary)' }}>{line.slice(0, 2)}</span>}
                {line.startsWith('🔊') && <span style={{ color: 'var(--secondary)' }}>{line.slice(0, 2)}</span>}
                {line.startsWith('🎛️') && <span style={{ color: 'var(--primary)' }}>{line.slice(0, 2)}</span>}
                {line.startsWith('✨') && <span style={{ color: 'var(--success)' }}>{line.slice(0, 1)}</span>}
                <span>{line.startsWith('⚡') || line.startsWith('🎙️') || line.startsWith('🔊') || line.startsWith('🎛️') || line.startsWith('✨') ? (line.startsWith('🎙️') || line.startsWith('🔊') || line.startsWith('🎛️') ? line.slice(2) : line.slice(1)) : line}</span>
              </div>
            ))}
            {terminalLines.length < TERMINAL_LINES.length && (
              <div><span className="terminal-cursor"></span></div>
            )}
          </div>
        </div>
      </section>

      {/* The Crew (Five Roles) */}
      <section className="crew-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="eyebrow" style={{ color: 'var(--ink-secondary)', fontSize: '0.75rem' }}>
              the order every episode moves through
            </span>
            <h2 className="landing-header" style={{
              fontSize: '2rem',
              color: 'var(--text-main)',
              fontWeight: 800,
              marginTop: '0.5rem'
            }}>
              Your Production Crew
            </h2>
          </div>

          <div className="crew-grid stagger-reveal">
            {[
              {
                num: '01',
                role: 'Continuity Editor',
                desc: 'Catches plot holes & timeline breaks against the previous episode.',
                icon: <FileText size={18} />,
                accent: 'var(--primary)'
              },
              {
                num: '02',
                role: 'Copyeditor',
                desc: 'Grammar & dialogue-cadence pass.',
                icon: <CheckCircle size={18} />,
                accent: 'var(--secondary)'
              },
              {
                num: '03',
                role: 'Genre Director',
                desc: 'Remixes tone (Noir/Horror/Funny/Drama/Sci-Fi) while preserving plot and character identity.',
                icon: <Sparkles size={18} />,
                accent: 'var(--primary)'
              },
              {
                num: '04',
                role: 'Voice Director',
                desc: 'Renders a tone-matched narrator voice with a mixed ambience bed.',
                icon: <Mic size={18} />,
                accent: 'var(--secondary)'
              },
              {
                num: '05',
                role: 'Publisher',
                desc: 'The explicit, deliberate step that ships an episode.',
                icon: <UploadCloud size={18} />,
                accent: 'var(--primary)'
              }
            ].map(m => (
              <div
                tabIndex={0}
                key={m.num}
                className="crew-card"
                onClick={onEnterDashboard}
                onKeyDown={(e) => { if (e.key === 'Enter') onEnterDashboard(); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--elevated-2)',
                    border: '1px solid var(--elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: m.accent,
                  }}>
                    {m.icon}
                  </div>
                  <span className="crew-num">{m.num}</span>
                </div>

                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    marginBottom: '0.4rem',
                    fontWeight: 700
                  }}>
                    {m.role}
                  </h3>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--ink-secondary)',
                    lineHeight: 1.5,
                    margin: 0
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
        backgroundColor: 'var(--void)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto'
      }}>
        <div style={{
          color: 'var(--text-muted-2)',
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.04em'
        }}>
          Pocket FM x OpenAI • Zero to One Hackathon
        </div>
      </footer>
    </div>
  );
};

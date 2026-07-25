import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, Activity, Disc } from 'lucide-react';
import { api } from '../api/client';

interface AgenticTelemetryHudProps {
  jobId: string;
  title: string;
  defaultSubstep?: string;
}

export const AgenticTelemetryHud: React.FC<AgenticTelemetryHudProps> = ({
  jobId,
  title,
  defaultSubstep = 'OpenAI Voice Engine',
}) => {
  const [stage, setStage] = useState<string>('⚡ Initializing AI Production Engine...');
  const [subStep, setSubStep] = useState<string>(defaultSubstep);
  const [logs, setLogs] = useState<string[]>([]);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;

    const pollTelemetry = async () => {
      try {
        const data = await api.getProgress(jobId);
        if (data) {
          setStage(data.stage || '⚡ Executing Production AI Pipeline...');
          if (data.subStep) setSubStep(data.subStep);
          if (Array.isArray(data.logs) && data.logs.length > 0) {
            setLogs(data.logs);
          }
        }
      } catch (e) {
        // Silently ignore telemetry poll errors
      }
    };

    pollTelemetry();
    interval = setInterval(pollTelemetry, 300);

    return () => {
      clearInterval(interval);
    };
  }, [jobId]);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{
      padding: '1.5rem',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-accent)',
      boxShadow: 'var(--shadow-glow)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.15rem',
      margin: '1rem 0',
      width: '100%',
    }}>
      {/* Visualizer Ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Rotating Conic Ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, var(--accent-red), var(--accent-amber), transparent 70%)',
            animation: 'spinConic 1.2s linear infinite',
          }} />

          {/* Inner Disk */}
          <div style={{
            position: 'absolute', inset: '3px', borderRadius: '50%',
            background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
          }}>
            {/* Equalizer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '22px' }}>
              <div style={{ width: '2px', height: '12px', background: 'var(--accent-red)', borderRadius: '1px', animation: 'eqBar 0.6s ease-in-out infinite alternate' }} />
              <div style={{ width: '2px', height: '20px', background: 'var(--accent-amber)', borderRadius: '1px', animation: 'eqBar 0.8s ease-in-out infinite alternate 0.15s' }} />
              <div style={{ width: '2px', height: '8px', background: 'var(--accent-red)', borderRadius: '1px', animation: 'eqBar 0.5s ease-in-out infinite alternate 0.3s' }} />
              <div style={{ width: '2px', height: '16px', background: 'var(--accent-amber)', borderRadius: '1px', animation: 'eqBar 0.7s ease-in-out infinite alternate 0.45s' }} />
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          }}>
            <Disc size={14} color="var(--accent-red)" className="spin" />
            {title}
          </div>
          <div style={{
            fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 500,
            marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          }}>
            <Activity size={12} color="var(--accent-red)" />
            {stage}
          </div>
        </div>

        <span className="badge-pill" style={{
          fontSize: '0.65rem', padding: '0.2rem 0.65rem',
          background: 'rgba(217, 119, 6, 0.12)',
          borderColor: 'rgba(217, 119, 6, 0.25)',
          color: 'var(--accent-amber)',
        }}>
          <Sparkles size={10} /> {subStep}
        </span>
      </div>

      {/* Terminal Log */}
      <div style={{
        width: '100%',
        background: 'var(--bg-void)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.7rem 1rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        maxHeight: '130px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }} ref={logTerminalRef}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          color: 'var(--ink-muted)', marginBottom: '0.2rem',
          fontSize: '0.62rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <Terminal size={10} color="var(--accent-red)" />
          Real-Time Telemetry
        </div>

        {logs.length > 0 ? (
          logs.map((logLine, idx) => (
            <div key={idx} style={{
              color: logLine.includes('✅') ? 'var(--terminal-green)' : logLine.includes('⚡') ? 'var(--accent-amber)' : 'var(--text-main)',
              lineHeight: 1.4,
            }}>
              {logLine}
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}>
            [00:00:00] Initializing production audio agent...
          </div>
        )}
      </div>
    </div>
  );
};

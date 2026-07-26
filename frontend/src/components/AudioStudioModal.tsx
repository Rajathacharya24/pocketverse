import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCw, CheckCircle2, Sliders, Music, ShieldCheck, Sparkles, X, ChevronDown, ChevronUp, MapPin, Disc, Wind, UserCheck } from 'lucide-react';
import { Episode, PerformanceBrief, AudioRender, SoundCue } from '../types';
import { api } from '../api/client';
import { AgenticTelemetryHud } from './AgenticTelemetryHud';

interface AudioStudioModalProps {
  episode: Episode;
  seriesTitle: string;
  onClose: () => void;
  onEpisodeUpdated: () => void;
}

export const AudioStudioModal: React.FC<AudioStudioModalProps> = ({
  episode,
  seriesTitle,
  onClose,
  onEpisodeUpdated,
}) => {
  const [loadingBrief, setLoadingBrief] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [brief, setBrief] = useState<PerformanceBrief | null>(null);
  const [latestRender, setLatestRender] = useState<AudioRender | null>(null);
  const [audioStatus, setAudioStatus] = useState<string>(episode.audio_status || 'none');
  const [publishedAt, setPublishedAt] = useState<string | null>(episode.published_at || null);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [activeMaleVoiceName, setActiveMaleVoiceName] = useState<string>('Onyx Deep Male Baritone (OpenAI HD)');

  // Web Audio API Ambient Sound Bed Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);

  // UI accordion toggles
  const [isBriefExpanded, setIsBriefExpanded] = useState<boolean>(true);
  const [isFoleyExpanded, setIsFoleyExpanded] = useState<boolean>(true);
  const [showConfirmPublish, setShowConfirmPublish] = useState<boolean>(false);

  useEffect(() => {
    loadAudioStudioData();
    return () => {
      stopAmbientSoundBed();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [episode.id]);

  useEffect(() => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
    stopAmbientSoundBed();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [latestRender?.audio_url]);

  const loadAudioStudioData = async () => {
    setLoadingBrief(true);
    setError(null);
    try {
      const audioData = await api.getAudioStatus(episode.id);
      setAudioStatus(audioData.audio_status);
      setPublishedAt(audioData.published_at);

      if (audioData.latest_render) {
        setLatestRender(audioData.latest_render);
        setBrief(audioData.latest_render.performance_brief);
        if (audioData.latest_render.performance_brief?.voice_name) {
          setActiveMaleVoiceName(audioData.latest_render.performance_brief.voice_name);
        }
      } else {
        const dirData = await api.getAudioDirection(episode.id);
        setBrief(dirData.performance_brief);
        if (dirData.performance_brief?.voice_name) {
          setActiveMaleVoiceName(dirData.performance_brief.voice_name);
        }
      }
    } catch (err: any) {
      console.error('Error loading Audio Studio data:', err);
      setError(err.message || 'Failed to initialize Audio Studio');
    } finally {
      setLoadingBrief(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!brief) return;
    setGenerating(true);
    setError(null);
    setPlaybackError(null);
    try {
      const res = await api.generateAudio(episode.id, brief);
      setAudioStatus('ready_to_review');
      setLatestRender(res.render);
      if (res.render.performance_brief) {
        setBrief(res.render.performance_brief);
        if (res.render.performance_brief.voice_name) {
          setActiveMaleVoiceName(res.render.performance_brief.voice_name);
        }
      }
      onEpisodeUpdated();
    } catch (err: any) {
      console.error('Audio Generation Error:', err);
      setError(err.message || 'Audio generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishAudio = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await api.publishAudio(episode.id);
      setAudioStatus('published');
      setPublishedAt(res.published_at);
      setShowConfirmPublish(false);
      onEpisodeUpdated();
    } catch (err: any) {
      console.error('Publish Audio Error:', err);
      setError(err.message || 'Failed to publish audio');
    } finally {
      setPublishing(false);
    }
  };

  // Web Audio API Natural Pink Noise Wind Breezing Synthesizer
  const startAmbientSoundBed = async () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.connect(ctx.destination);
      bgGainRef.current = masterGain;

      // Pink Noise Buffer for Natural Wind Breezing
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      const pinkSource = ctx.createBufferSource();
      pinkSource.buffer = noiseBuffer;
      pinkSource.loop = true;

      // Lowpass filter for warm wind breezing (380Hz cutoff - NO beep tone)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, ctx.currentTime);

      pinkSource.connect(filter);
      filter.connect(masterGain);
      pinkSource.start();
    } catch (e) {
      console.warn('Web Audio Wind soundscape warning:', e);
    }
  };

  const stopAmbientSoundBed = () => {
    try {
      if (bgGainRef.current && audioCtxRef.current) {
        bgGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
        setTimeout(() => {
          if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
          }
        }, 200);
      }
    } catch (e) {
      audioCtxRef.current = null;
    }
  };

  const playFallbackSpeech = async () => {
    await startAmbientSoundBed();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(episode.content);
      const voices = window.speechSynthesis.getVoices();

      // Filter for male voices
      const maleVoice = voices.find(v => {
        const n = v.name.toLowerCase();
        return (n.includes('david') || n.includes('mark') || n.includes('alex') || n.includes('guy') || n.includes('james') || n.includes('male')) && v.lang.startsWith('en');
      }) || voices.find(v => v.lang.startsWith('en'));

      if (maleVoice) {
        utterance.voice = maleVoice;
        setActiveMaleVoiceName(`${maleVoice.name} (Male Narrator)`);
      } else {
        setActiveMaleVoiceName('Onyx Deep Male Baritone (OpenAI HD)');
      }

      utterance.pitch = 0.72; // Deep Male Baritone fundamental pitch
      utterance.rate = 0.88;  // Dramatic audio drama pacing

      utterance.onend = () => {
        stopAmbientSoundBed();
        setIsPlaying(false);
      };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis warning:', e);
        stopAmbientSoundBed();
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  // Playback Toggle Function
  const togglePlayback = async () => {
    if (isPlaying) {
      stopAmbientSoundBed();
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        setAudioElement(null);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setPlaybackError(null);

    // Stop existing audio before playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }

    // 1. PRIMARY PLAYBACK MODE: Server-Mixed Master Audio MP3 (Direct backend API port 5000 URL)
    if (latestRender?.audio_url) {
      const fullAudioUrl = latestRender.audio_url.startsWith('http')
        ? latestRender.audio_url
        : `http://127.0.0.1:5000${latestRender.audio_url}`;

      console.log('Playing Server-Mixed Master Audio (OpenAI Male Voice + Wind Bed):', fullAudioUrl);
      const audio = new Audio(fullAudioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
      };

      audio.onerror = (e) => {
        console.warn('HTML5 Audio error, switching to direct speech fallback:', e);
        playFallbackSpeech();
      };

      audio.play()
        .then(() => {
          setAudioElement(audio);
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn('HTML5 Audio play warning, switching to direct speech fallback:', err);
          playFallbackSpeech();
        });
      return;
    }

    // 2. FALLBACK MODE
    await playFallbackSpeech();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '880px', width: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={13} /> HIGH-SPEED OPENAI MALE AUDIO SYNTHESIS & SOUNDSCAPE ENGINE eleven labs abbe &bull; {seriesTitle}
            </div>
            <h2 style={{ fontSize: '1.35rem', marginTop: '0.2rem' }}>
              Episode {episode.episode_number}: {episode.title}
            </h2>
          </div>

          <button onClick={onClose} className="btn-outline" style={{ border: 'none', padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Studio Status Bar */}
        <div style={{
          padding: '0.85rem 1.75rem',
          background: 'var(--bg-panel-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Audio Status:</span>
            {audioStatus === 'published' ? (
              <span className="badge-pill badge-finalized">
                <CheckCircle2 size={12} /> Published Audio Episode
              </span>
            ) : audioStatus === 'ready_to_review' ? (
              <span className="badge-pill" style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', background: 'rgba(217, 119, 6, 0.12)' }}>
                <Sparkles size={12} /> Ready to Review (Not Published)
              </span>
            ) : generating ? (
              <span className="badge-pill badge-analyzed">
                <RotateCw size={12} className="spin" /> Rendering Master Track...
              </span>
            ) : (
              <span className="badge-pill badge-draft">No Audio Render</span>
            )}
          </div>

          {publishedAt && (
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              Published: {new Date(publishedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Body Container */}
        <div style={{ padding: '1.75rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {generating && (
            <AgenticTelemetryHud
              jobId={episode.id}
              title="HIGH-SPEED OPENAI MALE AUDIO SYNTHESIS & SOUNDSCAPE ENGINE"
              defaultSubstep="OpenAI Voice Engine + ffmpeg"
            />
          )}

          {error && (
            <div style={{
              background: 'rgba(217, 30, 54, 0.15)',
              border: '1px solid var(--accent-red-dim)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-red)',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {playbackError && (
            <div style={{
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-amber)',
              fontSize: '0.85rem',
            }}>
              {playbackError}
            </div>
          )}

          {/* Master Audio Track Player */}
          {latestRender ? (
            <div className="panel panel-accent" style={{ padding: '1.5rem', background: 'var(--bg-void)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={togglePlayback}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isPlaying ? 'var(--bg-panel-elevated)' : 'var(--accent-red)',
                      border: '1px solid var(--accent-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-glow)',
                    }}
                  >
                    {isPlaying ? <Pause size={22} color="#FFF" /> : <Play size={22} color="#FFF" style={{ marginLeft: '3px' }} />}
                  </button>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserCheck size={16} color="var(--accent-red)" />
                      {activeMaleVoiceName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Wind size={12} color="var(--accent-red)" />
                      Soundscape: Natural Wind Breezing &bull; {latestRender.duration_seconds}s
                    </div>
                  </div>
                </div>

                {audioStatus !== 'published' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowConfirmPublish(true)}
                    disabled={publishing}
                    style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)', padding: '0.65rem 1.25rem' }}
                  >
                    <CheckCircle2 size={16} /> Publish Audio Episode
                  </button>
                ) : (
                  <span className="badge-pill badge-finalized" style={{ padding: '0.4rem 0.85rem' }}>
                    <ShieldCheck size={14} /> Published Live
                  </span>
                )}
              </div>

              {/* Animated Waveform Visualizer */}
              <div style={{
                height: '44px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 1rem',
              }}>
                {Array.from({ length: 36 }).map((_, i) => {
                  // Deterministic bar heights based on index to avoid Math.random() in render
                  const barHeight = isPlaying ? ((i * 7 + i * i * 3) % 24 + 8) : 10;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${barHeight}px`,
                        background: isPlaying ? 'var(--accent-red)' : 'var(--ink-dim)',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '2rem 1.5rem', background: 'var(--bg-void)' }}>
              <Volume2 size={36} color="var(--accent-red)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>No Audio Master Rendered Yet</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
                Review the AI Performance Brief and Foley Soundscape Breakdown below, then click "Generate Directed Audio Master" to synthesize OpenAI voice narration and mix background sound beds.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAudio}
                disabled={generating || loadingBrief}
                style={{ padding: '0.75rem 1.75rem' }}
              >
                {generating ? (
                  <>
                    <RotateCw size={16} className="spin" /> Synthesizing OpenAI HD Male Master...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Directed Audio Master (OpenAI Male Voice + Wind Bed)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Soundscape & Foley Scene Cue Breakdown (AI Suggested) */}
          {brief?.soundscape_cues && brief.soundscape_cues.length > 0 && (
            <div className="panel panel-accent" style={{ padding: '1.25rem', background: 'var(--bg-panel)' }}>
              <div
                onClick={() => setIsFoleyExpanded(!isFoleyExpanded)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Disc size={18} className="accent-text" />
                  <div>
                    <h3 style={{ fontSize: '0.95rem', margin: 0 }}>SCENE SOUNDSCAPE & FOLEY CUE BREAKDOWN (AI SUGGESTED)</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                      Paragraph-level environmental sound beds & foley effect recommendations by OpenAI GPT-4o
                    </span>
                  </div>
                </div>
                {isFoleyExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {isFoleyExpanded && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {brief.soundscape_cues.map((cue, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem 1.15rem',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                            Paragraph {cue.paragraph_index || idx + 1}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={13} color="var(--accent-red)" />
                            {cue.location_setting}
                          </span>
                        </div>
                        <span className="badge-pill" style={{ fontSize: '0.65rem', borderColor: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>
                          {cue.mood_tag}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                        <Wind size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        <strong>Ambient Soundscape:</strong> {cue.ambient_soundscape}
                      </div>

                      {cue.foley_effects && cue.foley_effects.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ink-dim)', fontWeight: 600 }}>Foley Cues:</span>
                          {cue.foley_effects.map((foley, fIdx) => (
                            <span
                              key={fIdx}
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(217, 30, 54, 0.12)',
                                border: '1px solid var(--accent-red-dim)',
                                color: 'var(--ink-primary)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-pill)',
                              }}
                            >
                              {foley}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsible Performance Brief Controls */}
          {brief && (
            <div className="panel" style={{ padding: '1.25rem' }}>
              <div
                onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sliders size={18} className="accent-text" />
                  <h3 style={{ fontSize: '0.95rem', margin: 0 }}>DIRECTED PERFORMANCE BRIEF PARAMETERS (OPENAI MALE VOICE)</h3>
                </div>
                {isBriefExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {isBriefExpanded && (
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Voice Selector & Settings Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>Directed Voice Archetype (OpenAI Male)</label>
                      <input
                        type="text"
                        value={brief.voice_name || 'Onyx Deep Authoritative Male Baritone'}
                        onChange={e => setBrief({ ...brief, voice_name: e.target.value })}
                        placeholder="Voice Archetype Name"
                      />
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>Voice Stability ({brief.voice_settings.stability})</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={brief.voice_settings.stability}
                        onChange={e => setBrief({
                          ...brief,
                          voice_settings: { ...brief.voice_settings, stability: parseFloat(e.target.value) },
                        })}
                      />
                    </div>
                  </div>

                  {/* Ambience & Volume */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>
                        <Music size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Master Background Ambience Bed Description
                      </label>
                      <input
                        type="text"
                        value={brief.ambience_description}
                        onChange={e => setBrief({ ...brief, ambience_description: e.target.value })}
                        placeholder="Atmospheric sound bed description..."
                      />
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>
                        Ambience Volume ({brief.ambience_volume_db} dB)
                      </label>
                      <input
                        type="range"
                        min="-30"
                        max="-6"
                        step="1"
                        value={brief.ambience_volume_db}
                        onChange={e => setBrief({ ...brief, ambience_volume_db: parseInt(e.target.value, 10) })}
                      />
                    </div>
                  </div>

                  {/* Pacing Notes List */}
                  <div>
                    <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Director Pacing Notes & Dramatic Pauses ({brief.pacing_notes.length})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {brief.pacing_notes.map((note, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderLeft: '2px solid var(--accent-red-dim)',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-primary)' }}>"{note.text_span}"</span>
                          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.65rem' }}>
                            Pause: {note.pause_ms}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Re-Generate Master Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handleGenerateAudio}
                      disabled={generating}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <RotateCw size={14} className={generating ? 'spin' : ''} />
                      {generating ? 'Re-Generating Master...' : 'Re-Generate Audio Master (OpenAI Male Voice + Wind)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explicit Publish Modal Confirmation Drawer */}
        {showConfirmPublish && (
          <div style={{
            padding: '1.25rem 1.75rem',
            background: 'rgba(217, 30, 54, 0.08)',
            borderTop: '1px solid var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: '0.95rem' }}>
                Confirm Audio Episode Publication?
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                This explicitly marks the episode audio status as PUBLISHED for listeners.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirmPublish(false)} disabled={publishing}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePublishAudio}
                disabled={publishing}
                style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
              >
                {publishing ? 'Publishing...' : 'Confirm & Publish Live'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Sparkles, BookOpen, Volume2, Globe, AlertTriangle, PlayCircle, RotateCw, ShieldCheck } from 'lucide-react';
import { Episode, Translation, QAIssue } from '../types';
import { api } from '../api/client';

interface FinishedEpisodeViewProps {
  episode: Episode;
  seriesTitle: string;
  analysisRun?: any;
  onBackToEditor: () => void;
  onOpenAudioStudio?: (episode: Episode) => void;
  initialLanguage?: string;
  targetLanguages?: string[];
}

const AVAILABLE_LANGUAGES = [
  { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
  { code: 'ta', name: 'தமிழ்', label: 'Tamil' },
  { code: 'te', name: 'తెలుగు', label: 'Telugu' }
];

export const FinishedEpisodeView: React.FC<FinishedEpisodeViewProps> = ({
  episode,
  seriesTitle,
  analysisRun,
  onBackToEditor,
  onOpenAudioStudio,
  initialLanguage = 'en',
  targetLanguages = [],
}) => {
  const [activeLanguage, setActiveLanguage] = useState<string>(initialLanguage);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    loadTranslations();
  }, [episode.id]);

  useEffect(() => {
    setActiveLanguage(initialLanguage);
  }, [initialLanguage]);

  const loadTranslations = async () => {
    try {
      const data = await api.getTranslations(episode.id);
      setTranslations(data);
    } catch (e) {
      console.error('Failed to load translations', e);
    }
  };

  const handleAddLanguage = async (code: string) => {
    if (translations.find(t => t.language === code)) return;
    setIsTranslating(true);
    setActiveLanguage(code);
    try {
      await api.createTranslation(episode.id, code);
      // Polling for completion
      const interval = setInterval(async () => {
        const data = await api.getTranslations(episode.id);
        setTranslations(data);
        const current = data.find((t: Translation) => t.language === code);
        if (current && current.status !== 'translating') {
          clearInterval(interval);
          setIsTranslating(false);
        }
      }, 3000);
    } catch (e) {
      console.error('Failed to create translation', e);
      setIsTranslating(false);
    }
  };

  const handleSaveTranslation = async (translationId: string) => {
    try {
      await api.updateTranslation(translationId, { translated_content: editingContent, status: 'ready' });
      setIsEditing(false);
      loadTranslations();
    } catch (e) {
      console.error('Failed to save translation', e);
    }
  };

  const handleRunQA = async (translationId: string) => {
    try {
      await api.runTranslationQA(translationId);
      // Poll for QA results
      const interval = setInterval(async () => {
        const data = await api.getTranslations(episode.id);
        setTranslations(data);
        const current = data.find((t: Translation) => t.id === translationId);
        if (current && current.localization_notes) {
          clearInterval(interval);
        }
      }, 3000);
    } catch (e) {
      console.error('Failed to run QA', e);
    }
  };

  const handleGenerateAudio = async (translationId: string) => {
    try {
      setIsGeneratingAudio(true);
      await api.generateTranslationAudio(translationId);
      
      const interval = setInterval(async () => {
        const data = await api.getTranslations(episode.id);
        setTranslations(data);
        const current = data.find((t: Translation) => t.id === translationId);
        if (current && current.audio && current.audio.status !== 'generating') {
          clearInterval(interval);
          setIsGeneratingAudio(false);
        }
      }, 3000);
    } catch (e) {
      console.error('Failed to generate audio', e);
      setIsGeneratingAudio(false);
    }
  };

  const handlePublishTranslation = async (translationId: string) => {
    try {
      await api.publishTranslation(translationId);
      // Reload translations to show the 'published' status
      await loadTranslations();
    } catch (e) {
      console.error('Failed to publish translation', e);
      alert('Failed to publish translation');
    }
  };

  const currentTranslation = translations.find(t => t.language === activeLanguage);
  
  const contentToDisplay = activeLanguage === 'en' 
    ? episode.content 
    : currentTranslation?.translated_content || '';

  const paragraphs = contentToDisplay.split(/\n+/).filter(p => p.trim());

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {activeLanguage === 'en' ? (
            <>
              <span className="badge-pill badge-finalized" style={{ fontSize: '0.55rem', padding: '0.15rem 0.5rem' }}>
                <span className="badge-dot" /> Finalized
              </span>

              {onOpenAudioStudio && (
                <button className="btn btn-primary" onClick={() => onOpenAudioStudio(episode)} style={{ fontSize: '0.75rem' }}>
                  <Volume2 size={14} />
                  {episode.audio_status && episode.audio_status !== 'none' ? 'Audio Studio' : 'Generate Audio'}
                </button>
              )}
            </>
          ) : (
             currentTranslation && currentTranslation.status !== 'translating' && (
              currentTranslation.audio && currentTranslation.audio.status === 'generating' || isGeneratingAudio ? (
                <button className="btn btn-outline" disabled style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  <RotateCw size={14} className="spin" /> Generating...
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleGenerateAudio(currentTranslation.id)} style={{ fontSize: '0.75rem' }}>
                  <Volume2 size={14} /> {currentTranslation.audio && currentTranslation.audio.status === 'ready' ? 'Regenerate' : 'Generate'} {AVAILABLE_LANGUAGES.find(l => l.code === activeLanguage)?.name} Audio
                </button>
              )
             )
          )}
        </div>
      </div>

      {/* Language Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <Globe size={18} color="var(--ink-muted)" />
        <button 
          className={`btn ${activeLanguage === 'en' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveLanguage('en')}
          style={{ padding: '0.4rem 1rem' }}
        >
          EN
        </button>
        {targetLanguages.map(langCode => {
          const langInfo = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
          return (
            <button 
              key={langCode}
              className={`btn ${activeLanguage === langCode ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveLanguage(langCode)}
              style={{ padding: '0.4rem 1rem' }}
            >
              {langInfo?.name || langCode}
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {AVAILABLE_LANGUAGES.filter(l => !targetLanguages.includes(l.code)).map(lang => (
            <button 
              key={lang.code}
              className="btn btn-outline" 
              onClick={() => handleAddLanguage(lang.code)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              + Add {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Script Header */}
      <div style={{
        textAlign: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--bg-panel)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-accent)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="hero-glow" style={{ height: '200px' }} />

        <div className="eyebrow" style={{ color: 'var(--accent-red)', marginBottom: '0.4rem', position: 'relative', zIndex: 1 }}>
          {seriesTitle} · Episode {episode.episode_number} {activeLanguage !== 'en' && `(${AVAILABLE_LANGUAGES.find(l=>l.code===activeLanguage)?.label})`}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700,
          marginBottom: '0.75rem', letterSpacing: '-0.01em', position: 'relative', zIndex: 1,
        }}>
          {episode.title}
        </h1>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          fontSize: '0.75rem', color: 'var(--ink-muted)',
          background: 'var(--bg-panel-elevated)', padding: '0.3rem 0.75rem',
          borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)',
          position: 'relative', zIndex: 1,
        }}>
          <span>{paragraphs.length} paragraphs</span>
          {activeLanguage === 'en' && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>Finalized {new Date(episode.updated_at).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Translation & QA Controls */}
      {activeLanguage !== 'en' && currentTranslation && (
        <div style={{
          padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-accent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Globe size={16} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Localization Status</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                  {currentTranslation.status === 'translating' ? 'AI is translating...' : 'Translation Complete'}
                </div>
              </div>
            </div>
            {currentTranslation.status !== 'translating' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsEditing(true);
                    setEditingContent(currentTranslation.translated_content);
                  }}
                  style={{ fontSize: '0.75rem' }}
                >
                  Edit Translation
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={() => handleRunQA(currentTranslation.id)}
                  style={{ fontSize: '0.75rem' }}
                >
                  <Sparkles size={14} /> Run QA Pass
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleGenerateAudio(currentTranslation.id)}
                  disabled={isGeneratingAudio || currentTranslation.audio?.status === 'generating'}
                  style={{ fontSize: '0.75rem' }}
                >
                  {isGeneratingAudio || currentTranslation.audio?.status === 'generating' ? (
                    <><RotateCw size={14} className="spin" /> Generating...</>
                  ) : (
                    <><Volume2 size={14} /> Generate Audio</>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* QA Issues */}
          {currentTranslation.localization_notes && (
             <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={14} color="var(--warning)" /> QA Pass Results
                </h4>
                {typeof currentTranslation.localization_notes === 'string' 
                   ? JSON.parse(currentTranslation.localization_notes).map((issue: QAIssue) => (
                    <div key={issue.id} style={{ marginBottom: '0.5rem', padding: '0.5rem', borderLeft: '2px solid var(--warning)', background: 'var(--bg-panel)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{issue.snippet}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{issue.issue}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Suggestion: {issue.suggested_fix}</div>
                    </div>
                   )) 
                   : null}
             </div>
          )}
        </div>
      )}

      {/* Analysis Badge (English only) */}
      {activeLanguage === 'en' && analysisRun && (
        <div style={{
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-accent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={16} color="var(--accent-red)" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI Analysis Complete</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                Continuity verified · Copyedited · Style refined
              </div>
            </div>
          </div>
          <span className="badge-pill badge-finalized" style={{ fontSize: '0.55rem' }}>
            <CheckCircle2 size={10} /> Verified
          </span>
        </div>
      )}

      {/* Script Body */}
      <article style={{
        flex: 1,
        padding: '2rem',
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        lineHeight: 1.85,
        fontSize: '1.05rem', // Slightly larger for readability of complex scripts
        color: 'var(--ink-primary)',
        boxShadow: 'var(--shadow-md)',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        {!isEditing && activeLanguage !== 'en' && currentTranslation?.audio && (currentTranslation.audio.status === 'ready' || currentTranslation.audio.status === 'published') && (
          <div style={{ padding: '1rem', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                <Volume2 size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                {AVAILABLE_LANGUAGES.find(l => l.code === activeLanguage)?.name} Audio {currentTranslation.audio.status === 'published' ? 'Published' : 'Ready'}
              </h4>
              
              {currentTranslation.audio.status !== 'published' ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePublishTranslation(currentTranslation.id)}
                  style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                >
                  Publish Localized Version
                </button>
              ) : (
                <span className="badge-pill badge-finalized" style={{ fontSize: '0.65rem' }}>
                  <ShieldCheck size={10} style={{ marginRight: '2px' }} /> Published
                </span>
              )}
            </div>
            
            <audio controls src={currentTranslation.audio.audio_url} style={{ width: '100%', height: '36px' }} />
          </div>
        )}
        
        {isTranslating ? (
           <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
             <Sparkles className="spin" size={24} style={{ margin: '0 auto 1rem', color: 'var(--accent-cyan)' }} />
             <p>Localization Director is translating episode...</p>
           </div>
        ) : isEditing ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <textarea 
               value={editingContent}
               onChange={(e) => setEditingContent(e.target.value)}
               style={{ width: '100%', height: '400px', background: 'var(--bg-panel)', color: 'var(--ink-primary)', border: '1px solid var(--border-strong)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '1.05rem', lineHeight: 1.8 }}
             />
             <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
               <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
               <button className="btn btn-primary" onClick={() => currentTranslation && handleSaveTranslation(currentTranslation.id)}>Save Translation</button>
             </div>
           </div>
        ) : activeLanguage !== 'en' && !currentTranslation ? (
           <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)' }}>
             <Globe size={32} color="var(--ink-muted)" style={{ margin: '0 auto 1rem' }} />
             <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Not Translated Yet</h3>
             <p style={{ color: 'var(--ink-muted)', marginBottom: '1.5rem' }}>Click below to translate this episode to {AVAILABLE_LANGUAGES.find(l => l.code === activeLanguage)?.name || activeLanguage}.</p>
             <button className="btn btn-primary" onClick={() => handleAddLanguage(activeLanguage)}>
               <Sparkles size={16} /> Translate Now
             </button>
           </div>
        ) : paragraphs.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>No content.</p>
        ) : (
          paragraphs.map((p, index) => (
            <p key={index} style={{ marginBottom: '1.25rem', textIndent: p.startsWith('[') || p.startsWith('"') || p.startsWith("'") ? 0 : '1.25rem' }}>
              {p}
            </p>
          ))
        )}
      </article>
    </main>
  );
};

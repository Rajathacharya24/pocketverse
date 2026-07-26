import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { EpisodeList } from './EpisodeList';
import { SeriesModal } from './SeriesModal';
import { AudioStudioModal } from './AudioStudioModal';
import { api } from '../api/client';
import { Series, Episode } from '../types';
import { RotateCw, LayoutDashboard, FileText, ArrowLeft } from 'lucide-react';

export const CreatorLayout: React.FC = () => {
  const { seriesId, episodeId } = useParams<{ seriesId: string; episodeId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesData, setSeriesData] = useState<Series | null>(null);
  
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [audioTargetEpisode, setAudioTargetEpisode] = useState<Episode | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeriesList();
  }, []);

  useEffect(() => {
    if (seriesId) {
      loadSeriesDetails(seriesId);
    }
  }, [seriesId]);

  const loadSeriesList = async () => {
    try {
      const list = await api.getAllSeries();
      setSeriesList(list);
      if (list.length > 0 && !seriesId) {
        navigate(`/studio/${list[0].id}`);
      }
    } catch (err: any) {
      console.error('Failed to load series:', err);
    }
  };

  const loadSeriesDetails = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getSeriesById(id);
      setSeriesData(data);
    } catch (err: any) {
      console.error('Failed to load series details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeries = async (title: string, targetLanguages: string[]) => {
    try {
      const newSeries = await api.createSeries({ title, target_languages: targetLanguages });
      await loadSeriesList();
      setIsSeriesModalOpen(false);
      navigate(`/studio/${newSeries.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEpisode = async () => {
    if (!seriesData) return;
    try {
      const newEp = await api.createEpisode(seriesData.id, { title: 'New Episode', content: 'Start writing here...' });
      await loadSeriesDetails(seriesData.id);
      navigate(`/studio/${seriesData.id}/episode/${newEp.id}/edit`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEpisode = async (epId: string) => {
    try {
      await api.deleteEpisode(epId);
      await loadSeriesDetails(seriesData!.id);
      if (episodeId === epId) {
        navigate(`/studio/${seriesData!.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentEpisode = seriesData?.episodes?.find(e => e.id === episodeId);
  
  // Active states for nav
  const isDashboard = location.pathname === `/studio/${seriesId}`;
  const isEditor = location.pathname.includes('/edit');

  return (
    <div className="app-container">
      <Header
        seriesList={seriesList}
        selectedSeries={seriesData}
        onSelectSeries={(series: Series) => {
          navigate(`/studio/${series.id}`);
        }}
        onOpenNewSeriesModal={() => setIsSeriesModalOpen(true)}
        onCreateEpisode={handleCreateEpisode}
      />

      {/* Creator Navigation Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem',
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {episodeId && (
            <button
              onClick={() => navigate(`/studio/${seriesId}`)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem',
              }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <button
            onClick={() => navigate(`/studio/${seriesId}`)}
            style={{
              fontSize: '0.75rem', padding: '0.4rem 0.85rem',
              background: isDashboard ? 'var(--accent-red-dim)' : 'transparent',
              color: isDashboard ? 'var(--accent-red)' : 'var(--ink-secondary)',
              border: `1px solid ${isDashboard ? 'rgba(217,30,54,0.2)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-body)',
            }}
          >
            <LayoutDashboard size={13} /> Dashboard
          </button>

          {currentEpisode && (
            <button
              onClick={() => navigate(`/studio/${seriesId}/episode/${currentEpisode.id}/edit`)}
              style={{
                fontSize: '0.75rem', padding: '0.4rem 0.85rem',
                background: isEditor ? 'var(--accent-red-dim)' : 'transparent',
                color: isEditor ? 'var(--accent-red)' : 'var(--ink-secondary)',
                border: `1px solid ${isEditor ? 'rgba(217,30,54,0.2)' : 'transparent'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font-body)',
              }}
            >
              <FileText size={13} /> Ep {currentEpisode.episode_number}: {currentEpisode.title}
            </button>
          )}
        </div>

        {seriesData && (
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
            {seriesData.title} · {seriesData.episodes?.length || 0} episodes
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        {/* Sidebar */}
        <EpisodeList
          episodes={seriesData?.episodes || []}
          selectedEpisodeId={episodeId || null}
          onSelectEpisode={(epId) => {
            const ep = seriesData?.episodes?.find((e: any) => e.id === epId);
            if (ep?.status === 'finalized') {
              navigate(`/studio/${seriesId}/episode/${epId}/published/en`);
            } else {
              navigate(`/studio/${seriesId}/episode/${epId}/edit`);
            }
          }}
          onCreateEpisode={handleCreateEpisode}
          onDeleteEpisode={handleDeleteEpisode}
          onOpenAudioStudio={(ep) => {
            setAudioTargetEpisode(ep);
            setIsAudioStudioOpen(true);
          }}
        />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {loading ? (
             <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--ink-muted)' }}>
               <RotateCw size={32} className="spin" style={{ marginBottom: '1rem', color: 'var(--accent-red)' }} />
               <div>Loading PocketVerse...</div>
             </div>
          ) : (
            <Outlet context={{ 
              series: seriesData, 
              seriesList, 
              currentEpisode, 
              loadSeriesDetails,
              onOpenAudioStudio: (ep: any) => {
                setAudioTargetEpisode(ep);
                setIsAudioStudioOpen(true);
              }
            }} />
          )}
        </div>
      </div>

      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onCreateSeries={handleCreateSeries}
      />

      {isAudioStudioOpen && audioTargetEpisode && (
        <AudioStudioModal
          episode={audioTargetEpisode}
          seriesTitle={seriesData?.title || 'Series'}
          onClose={() => {
            setIsAudioStudioOpen(false);
            setAudioTargetEpisode(null);
          }}
          onEpisodeUpdated={async () => {
             await loadSeriesDetails(seriesId!);
          }}
        />
      )}
    </div>
  );
};

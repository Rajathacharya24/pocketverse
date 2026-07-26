import React from 'react';
import { Routes, Route, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { CreatorLayout } from './components/CreatorLayout';
import { CreatorDashboard } from './components/CreatorDashboard';
import { EpisodeEditor } from './components/EpisodeEditor';
import { FinishedEpisodeView } from './components/FinishedEpisodeView';
import { WizardContainer } from './components/Wizard/WizardContainer';
import { LandingPage } from './components/LandingPage';
import { Series, Episode } from './types';
import { api } from './api/client';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage onEnterDashboard={() => {
        // Find default series to redirect to, or just go to /studio
        api.getAllSeries().then(list => {
          if (list.length > 0) {
            window.location.href = `/studio/${list[0].id}`;
          } else {
            window.location.href = `/studio`;
          }
        });
      }} />} />
      <Route path="/studio" element={<CreatorLayout />}>
        <Route path=":seriesId" element={<DashboardWrapper />} />
        <Route path=":seriesId/episode/:episodeId/edit" element={<EditorWrapper />} />
        <Route path=":seriesId/episode/:episodeId/wizard" element={<WizardWrapper />} />
        <Route path=":seriesId/episode/:episodeId/published/:lang" element={<PublishedWrapper />} />
      </Route>
    </Routes>
  );
}

// Wrapper components to map Outlet context and URL params to component props
const DashboardWrapper = () => {
  const { series, seriesList, loadSeriesDetails, onOpenAudioStudio } = useOutletContext<any>();
  const navigate = useNavigate();
  return (
    <CreatorDashboard
      series={series}
      seriesList={seriesList}
      selectedEpisodeId={null}
      onSelectSeries={(s) => navigate(`/studio/${s.id}`)}
      onSelectEpisode={(epId, lang = 'en') => {
        const ep = series?.episodes?.find((e: any) => e.id === epId);
        if (ep?.status === 'finalized' || lang !== 'en') {
          navigate(`/studio/${series?.id}/episode/${epId}/published/${lang}`);
        } else {
          navigate(`/studio/${series?.id}/episode/${epId}/edit`);
        }
      }}
      onCreateEpisode={async () => {
        const newEp = await api.createEpisode(series.id, { title: 'New Episode', content: 'Start writing here...' });
        await loadSeriesDetails(series.id);
        navigate(`/studio/${series.id}/episode/${newEp.id}/edit`);
      }}
      onOpenNewSeriesModal={() => {}}
      onDeleteEpisode={async (epId) => {
        await api.deleteEpisode(epId);
        await loadSeriesDetails(series.id);
      }}
      onDeleteSeries={async (sId) => {
        await api.deleteSeries(sId);
        navigate('/');
      }}
      onOpenAudioStudio={onOpenAudioStudio}
      onOpenWizard={(ep) => navigate(`/studio/${series?.id}/episode/${ep.id}/wizard`)}
      onRefreshSeries={async () => {
        if (series) await loadSeriesDetails(series.id);
      }}
    />
  );
};

const EditorWrapper = () => {
  const { currentEpisode, loadSeriesDetails, series } = useOutletContext<any>();
  const navigate = useNavigate();
  
  if (!currentEpisode) return null;

  return (
    <EpisodeEditor
      episode={currentEpisode}
      onSaveContent={async (title, content) => {
        await api.updateEpisode(currentEpisode.id, { title, content });
        await loadSeriesDetails(series.id);
      }}
      onLaunchWizard={() => navigate(`/studio/${series.id}/episode/${currentEpisode.id}/wizard`)}
      onViewFinalized={() => navigate(`/studio/${series.id}/episode/${currentEpisode.id}/published/en`)}
    />
  );
};

const WizardWrapper = () => {
  const { currentEpisode, loadSeriesDetails, series } = useOutletContext<any>();
  const navigate = useNavigate();
  
  if (!currentEpisode) return null;

  return (
    <WizardContainer
      episode={currentEpisode}
      initialStep={1}
      onClose={() => navigate(`/studio/${series.id}/episode/${currentEpisode.id}/edit`)}
      onComplete={async () => {
        await loadSeriesDetails(series.id);
        navigate(`/studio/${series.id}/episode/${currentEpisode.id}/published/en`);
      }}
    />
  );
};

const PublishedWrapper = () => {
  const { currentEpisode, series, onOpenAudioStudio } = useOutletContext<any>();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const [latestAnalysis, setLatestAnalysis] = React.useState<any>(null);

  React.useEffect(() => {
    if (currentEpisode) {
      api.getEpisodeById(currentEpisode.id).then(data => {
        setLatestAnalysis(data.latest_analysis);
      });
    }
  }, [currentEpisode]);

  if (!currentEpisode) return null;

  return (
    <FinishedEpisodeView
      episode={currentEpisode}
      seriesTitle={series?.title || 'Series'}
      analysisRun={latestAnalysis}
      initialLanguage={lang || 'en'}
      targetLanguages={series?.target_languages || []}
      onBackToEditor={() => navigate(`/studio/${series.id}/episode/${currentEpisode.id}/edit`)}
      onOpenAudioStudio={onOpenAudioStudio}
    />
  );
};

export default App;

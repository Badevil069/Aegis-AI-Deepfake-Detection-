import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileBadge2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ResultDashboard from '../components/ResultDashboard';
import { generateMockResult } from '../data/mockData';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const fallbackResult = useMemo(
    () => generateMockResult({ mode: 'video', source: 'upload', filename: 'demo-sample.mp4' }),
    [],
  );

  const result = location.state?.result || fallbackResult;
  const previewUrl = location.state?.previewUrl || '';

  const handleDownload = () => {
    const reportPayload = {
      reportId: result.id,
      generatedAt: new Date().toISOString(),
      filename: result.filename,
      mode: result.mode,
      score: result.score,
      label: result.label,
      confidence: result.confidence,
      summary: result.summary,
      insights: result.insights,
      providers: result.providers || [],
    };

    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${result.filename || 'deepfake-report'}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <PageTransition className="space-y-8 py-10">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-brand-cyan">
            <FileBadge2 className="h-3.5 w-3.5" />
            Results Dashboard
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold text-white">Deepfake Detection Report</h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Review risk score, forensic insights, and timeline drift from the mock multimodal analysis.
          </p>
        </div>
      </section>

      <ResultDashboard
        result={result}
        previewUrl={previewUrl}
        onDownload={handleDownload}
        onReanalyze={() => navigate('/detect')}
      />

      {result.providers?.length > 0 && (
        <section className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white">API Placeholder Providers</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.providers.map((provider) => (
              <div key={provider.provider} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-semibold text-slate-100">{provider.provider}</p>
                <p className="mt-1 text-xs text-slate-400">Mode: {provider.mode}</p>
                <p className="mt-1 text-xs text-slate-400">Provider score: {provider.score}%</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  {provider.findings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageTransition>
  );
}

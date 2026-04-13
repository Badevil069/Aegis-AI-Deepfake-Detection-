import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileBadge2, Clock, Mail } from 'lucide-react'; // Added Mail icon
import PageTransition from '../components/PageTransition';
import ResultDashboard from '../components/ResultDashboard';
import { generateMockResult } from '../data/mockData';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Fallback if someone navigates here directly without state
  const fallbackResult = useMemo(
    () => generateMockResult({ mode: 'video', source: 'upload', filename: 'demo-sample.mp4' }),
    [],
  );

  const result = location.state?.result || fallbackResult;
  const previewUrl = location.state?.previewUrl || '';
  const isEmail = result.mode === 'email';

  const handleDownload = () => {
    const reportPayload = {
      reportId: result.id,
      generatedAt: new Date().toISOString(),
      filename: result.filename,
      mode: result.mode,
      score: result.score,
      label: result.label,
      summary: result.summary,
      insights: result.insights,
      providers: result.providers || [],
    };

    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${result.filename || 'aegis-forensic-report'}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <PageTransition className="space-y-8 py-12">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="cyber-badge cyber-badge-glow">
              {isEmail ? <Mail className="h-3 w-3" /> : <FileBadge2 className="h-3 w-3" />}
              {isEmail ? 'Email Forensic Dashboard' : 'Results Dashboard'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {new Date(result.generatedAt || Date.now()).toLocaleString()}
            </span>
          </div>
          
          <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
            {isEmail ? 'Phishing Analysis' : 'Deepfake Detection'}{' '}
            <span className="glow-text">Report</span>
          </h1>
          
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            {isEmail 
              ? 'Review AI-generated forensic insights, header verification, and malicious intent scoring.'
              : 'Review risk score, forensic insights, and timeline drift from the multimodal analysis.'}
          </p>
        </div>
      </section>

      <ResultDashboard
        result={result}
        previewUrl={previewUrl}
        onDownload={handleDownload}
        onReanalyze={() => navigate('/detect')}
      />

      {/* Provider cards - Only show if providers exist (usually for media) */}
      {result.providers?.length > 0 && (
        <section className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">API Provider Analysis</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {result.providers.map((provider) => (
              <div key={provider.provider} className="rounded-xl border border-white/6 bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-200">{provider.provider}</p>
                  <span className="cyber-badge text-[9px]">{provider.mode}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Score: <span className="font-mono text-brand-cyan">{provider.score}%</span>
                </p>
                <ul className="list-none space-y-1.5">
                  {provider.findings.map((finding) => (
                    <li key={finding} className="flex items-start gap-2 text-xs text-slate-400">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-cyan/50" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Email Specific Footer (Optional Hackathon Tip) */}
      {isEmail && (
        <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4 text-center">
          <p className="text-sm text-brand-cyan">
            Forensic Tip: Always verify the "Return-Path" header against the "From" address to confirm sender identity.
          </p>
        </div>
      )}
    </PageTransition>
  );
}
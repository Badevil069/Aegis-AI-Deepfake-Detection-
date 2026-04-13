import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileBadge2, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';
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
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 64;

    const writeLine = (text, size = 11, weight = 'normal', color = [30, 41, 59]) => {
      doc.setFont('helvetica', weight);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(String(text), maxWidth);
      lines.forEach((line) => {
        if (y > pageHeight - 56) {
          doc.addPage();
          y = 64;
        }
        doc.text(line, margin, y);
        y += size + 4;
      });
    };

    writeLine('Aegis Sentinel - Deepfake Detection Report', 18, 'bold', [15, 23, 42]);
    y += 4;
    writeLine(`Generated: ${new Date().toLocaleString()}`);
    writeLine(`Report ID: ${result.id || 'N/A'}`);
    writeLine(`Filename: ${result.filename || 'N/A'}`);
    writeLine(`Mode: ${result.mode || 'N/A'}`);
    writeLine(`Score: ${result.score}%`);
    writeLine(`Label: ${result.label}`);
    writeLine(`Confidence: ${result.confidence}%`);
    y += 8;
    writeLine('Summary', 13, 'bold');
    writeLine(result.summary || 'No summary available.');
    y += 8;

    writeLine('Insights', 13, 'bold');
    (result.insights || []).forEach((insight, idx) => {
      writeLine(`${idx + 1}. ${insight.title} [${insight.severity}] (${insight.confidence}%)`);
    });

    if ((result.providers || []).length > 0) {
      y += 8;
      writeLine('Provider Analysis', 13, 'bold');
      result.providers.forEach((provider) => {
        writeLine(`${provider.provider} - ${provider.mode} - Score ${provider.score}%`, 11, 'bold');
        (provider.findings || []).forEach((finding) => writeLine(`- ${finding}`));
      });
    }

    const safeBase = (result.filename || 'deepfake-report').replace(/\.[^/.]+$/, '');
    doc.save(`${safeBase}-report.pdf`);
  };

  return (
    <PageTransition className="space-y-8 py-12">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="cyber-badge cyber-badge-glow">
              <FileBadge2 className="h-3 w-3" />
              Results Dashboard
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {new Date(result.generatedAt).toLocaleString()}
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
            Deepfake Detection <span className="glow-text">Report</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            Review risk score, forensic insights, and timeline drift from the multimodal analysis.
          </p>
        </div>
      </section>

      <ResultDashboard
        result={result}
        previewUrl={previewUrl}
        onDownload={handleDownload}
        onReanalyze={() => navigate('/detect')}
      />

      {/* Provider cards */}
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
    </PageTransition>
  );
}

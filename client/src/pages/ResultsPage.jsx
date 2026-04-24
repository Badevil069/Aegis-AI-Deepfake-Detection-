import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileBadge2, Clock, Mail } from 'lucide-react';
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
  const isEmail = result.mode === 'email';

  const handleDownload = () => {
    if (isEmail) {
      const reportPayload = {
        reportId: result.id, generatedAt: new Date().toISOString(),
        filename: result.filename, mode: result.mode, score: result.score,
        label: result.label, summary: result.summary, insights: result.insights,
        providers: result.providers || [],
      };
      const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.filename || 'aegis-forensic-report'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    const pageH = doc.internal.pageSize.getHeight();
    const maxW = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 64;
    const writeLine = (text, size = 11, weight = 'normal', color = [30, 41, 59]) => {
      doc.setFont('helvetica', weight); doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.splitTextToSize(String(text), maxW).forEach((line) => {
        if (y > pageH - 56) { doc.addPage(); y = 64; }
        doc.text(line, margin, y); y += size + 4;
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
    y += 8; writeLine('Summary', 13, 'bold');
    writeLine(result.summary || 'No summary available.'); y += 8;
    writeLine('Insights', 13, 'bold');
    (result.insights || []).forEach((ins, i) => writeLine(`${i + 1}. ${ins.title} [${ins.severity}] (${ins.confidence}%)`));
    if ((result.providers || []).length > 0) {
      y += 8; writeLine('Provider Analysis', 13, 'bold');
      result.providers.forEach((p) => {
        writeLine(`${p.provider} - ${p.mode} - Score ${p.score}%`, 11, 'bold');
        (p.findings || []).forEach((f) => writeLine(`- ${f}`));
      });
    }
    doc.save(`${(result.filename || 'deepfake-report').replace(/\.[^/.]+$/, '')}-report.pdf`);
  };

  return (
    <PageTransition className="space-y-8 py-12">
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />

      <section className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="cyber-badge cyber-badge-glow">
              {isEmail ? <Mail className="h-3 w-3" /> : <FileBadge2 className="h-3 w-3" />}
              {isEmail ? 'Email Forensic Dashboard' : 'Results Dashboard'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {new Date(result.generatedAt || Date.now()).toLocaleString()}
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white md:text-5xl deepshield-glow-text">
            {isEmail ? 'Phishing Analysis' : 'Deepfake Detection'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Report</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            {isEmail
              ? 'Review AI-generated forensic insights, header verification, and malicious intent scoring.'
              : 'Review risk score, forensic insights, and timeline drift from the multimodal analysis.'}
          </p>
        </div>
      </section>

      <div className="relative z-10">
        <ResultDashboard result={result} previewUrl={previewUrl} onDownload={handleDownload} onReanalyze={() => navigate('/detect')} />
      </div>

      {result.providers?.length > 0 && (
        <section className="relative z-10 deepshield-feature-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4 deepshield-glow-text">API Provider Analysis</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {result.providers.map((p) => (
              <div key={p.provider} className="rounded-xl border border-cyan-500/10 bg-black/30 p-4 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-200">{p.provider}</p>
                  <span className="cyber-badge text-[9px]">{p.mode}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Score: <span className="font-mono text-cyan-400">{p.score}%</span></p>
                <ul className="list-none space-y-1.5">
                  {p.findings.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400/50" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {isEmail && (
        <div className="relative z-10 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
          <p className="text-sm text-cyan-400">Forensic Tip: Always verify the "Return-Path" header against the "From" address to confirm sender identity.</p>
        </div>
      )}
    </PageTransition>
  );
}
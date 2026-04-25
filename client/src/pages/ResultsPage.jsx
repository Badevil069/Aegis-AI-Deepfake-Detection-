import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileBadge2, Clock, Mail, Trash2, History } from 'lucide-react';
import { jsPDF } from 'jspdf';
import PageTransition from '../components/PageTransition';
import ResultDashboard from '../components/ResultDashboard';
import FantasyBackground from '../components/FantasyBackground';
import { getDetectionHistory, clearDetectionHistory } from '../utils/history';

function HistoryCard({ result, isActive, onClick }) {
  const labelColor = result.label === 'Fake' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' :
                     result.label === 'Suspicious' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                     'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
                     
  return (
    <button 
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all min-w-[240px] max-w-[280px] shrink-0 interactive ${isActive ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-white/10 bg-[#0a0f1a]/50 hover:border-cyan-400/50'}`}
    >
      <div className="flex justify-between items-start mb-2">
         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${labelColor}`}>
            {result.label}
         </span>
         <span className="text-[10px] text-slate-500 font-mono">
            {new Date(result.generatedAt || Date.now()).toLocaleDateString()}
         </span>
      </div>
      <p className="text-sm font-semibold text-white truncate">{result.filename || 'Analysis Session'}</p>
      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{result.mode} Mode</p>
      <div className="mt-3 flex items-center justify-between">
         <span className="text-xs text-slate-500">Score</span>
         <span className="font-mono text-cyan-400 font-bold">{result.score}%</span>
      </div>
    </button>
  );
}

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [activeResult, setActiveResult] = useState(null);

  useEffect(() => {
    const data = getDetectionHistory();
    setHistory(data);
    
    // If navigated directly from processing, prioritize the passed result
    if (location.state?.result) {
      setActiveResult(location.state.result);
      window.history.replaceState({}, document.title); // clean state to avoid sticky refresh
    } else if (data.length > 0) {
      setActiveResult(data[0]);
    }
  }, [location.state]);

  const handleClearHistory = () => {
    if(window.confirm('Are you sure you want to clear all historical detections?')) {
      clearDetectionHistory();
      setHistory([]);
      setActiveResult(null);
    }
  };

  const handleDownload = () => {
    if (!activeResult) return;
    const result = activeResult;
    const isEmail = result.mode === 'email';

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

  if (!activeResult) {
    return (
      <PageTransition className="space-y-8 pt-32 pb-20 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />
        <FantasyBackground />
        <div className="relative z-10 text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <History className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 deepshield-glow-text">Detection Dashboard</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">You have no detection history. Upload a file, intercept a live stream, or scan an email to populate your forensic dashboard.</p>
            <button
                onClick={() => navigate('/detect')}
                className="deepshield-btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm uppercase tracking-widest interactive"
            >
                Start Detection
            </button>
        </div>
      </PageTransition>
    );
  }

  const isEmail = activeResult.mode === 'email';

  return (
    <PageTransition className="space-y-6 pt-28 pb-12">
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />
      <FantasyBackground />

      {/* Historical Logs Sidebar / Topbar */}
      {history.length > 0 && (
        <section className="relative z-10 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History className="h-4 w-4 text-cyan-400" />
                    Detection History
                </h2>
                <button 
                    onClick={handleClearHistory} 
                    className="text-[10px] uppercase tracking-widest text-rose-400/70 hover:text-rose-400 transition-colors flex items-center gap-1 interactive"
                >
                    <Trash2 className="h-3 w-3" /> Clear History
                </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {history.map((res) => (
                    <HistoryCard 
                        key={res.id} 
                        result={res} 
                        isActive={activeResult.id === res.id} 
                        onClick={() => setActiveResult(res)} 
                    />
                ))}
            </div>
        </section>
      )}

      <section className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="cyber-badge cyber-badge-glow">
              {isEmail ? <Mail className="h-3 w-3" /> : <FileBadge2 className="h-3 w-3" />}
              {isEmail ? 'Email Forensic Dashboard' : 'Results Dashboard'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {new Date(activeResult.generatedAt || Date.now()).toLocaleString()}
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

      <div className="relative z-10 mt-6">
        <ResultDashboard 
            result={activeResult} 
            previewUrl={location.state?.result?.id === activeResult.id ? location.state?.previewUrl : ''} 
            onDownload={handleDownload} 
            onReanalyze={() => navigate('/detect')} 
        />
      </div>

      {activeResult.providers?.length > 0 && (
        <section className="relative z-10 deepshield-feature-card p-5 mt-6">
          <h2 className="text-lg font-semibold text-white mb-4 deepshield-glow-text">API Provider Analysis</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {activeResult.providers.map((p) => (
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
        <div className="relative z-10 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center mt-6">
          <p className="text-sm text-cyan-400">Forensic Tip: Always verify the "Return-Path" header against the "From" address to confirm sender identity.</p>
        </div>
      )}
    </PageTransition>
  );
}
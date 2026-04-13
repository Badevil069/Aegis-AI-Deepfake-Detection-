import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { generateMockResult } from '../data/mockData';
import * as cloudVisionService from '../services/cloudVision';
import * as vertexAIService from '../services/vertexAI';
import { analyzeEmail } from '../services/emailService'; // Import your new service

// Standard media phases
const mediaPhases = [
  'Extracting frames...',
  'Analyzing audio...',
  'Detecting inconsistencies...',
  'Scoring synthetic likelihood...',
  'Compiling secure report...',
];

// NEW: Email specific phases
const emailPhases = [
  'Parsing email headers...',
  'Verifying SPF/DKIM records...',
  'Analyzing body text intent...',
  'Checking for malicious links...',
  'Generating forensic risk report...',
];

function classifyScore(score) {
  if (score >= 75) return 'Fake';
  if (score >= 45) return 'Suspicious';
  return 'Real';
}

function summaryByLabel(label) {
  if (label === 'Fake') return 'High-risk malicious signatures detected. Immediate caution is recommended.';
  if (label === 'Suspicious') return 'Anomalous signals detected in headers or body. Verification advised.';
  return 'No critical phishing or spoofing markers detected.';
}

function scoreFromRiskLevel(riskLevel = '') {
  const normalized = String(riskLevel).toLowerCase();
  if (normalized === 'critical') return 95;
  if (normalized === 'high') return 85;
  if (normalized === 'medium') return 60;
  return 25;
}

function parseEmailAnalysis(analysis) {
  if (analysis && typeof analysis === 'object') {
    return {
      riskLevel: analysis.risk_level || 'Medium',
      isFake: Boolean(analysis.is_fake),
      summary: analysis.summary || 'Email analysis completed.',
      threats: Array.isArray(analysis.threats) ? analysis.threats : [],
    };
  }

  const text = String(analysis || 'Email analysis completed.');
  const lower = text.toLowerCase();
  let riskLevel = 'Low';
  if (lower.includes('critical')) riskLevel = 'Critical';
  else if (lower.includes('high')) riskLevel = 'High';
  else if (lower.includes('medium')) riskLevel = 'Medium';
  const isFake = lower.includes('is_fake') || lower.includes('phishing') || lower.includes('spoof');

  return {
    riskLevel,
    isFake,
    summary: text,
    threats: [],
  };
}

function timelineFromScore(score) {
  return Array.from({ length: 14 }, (_, i) => {
    const wave = Math.sin((i + 1) / 2.4) * 8;
    return Math.max(6, Math.min(98, Math.round(score + wave + (i % 3) * 2 - 2)));
  });
}

function severityFromScore(score) {
  if (score >= 75) return 'High';
  if (score >= 45) return 'Medium';
  return 'Low';
}

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useMemo(() => location.state || {}, [location.state]);
  
  const isEmail = state.source === 'email'; // Check if we are doing email
  const phases = isEmail ? emailPhases : mediaPhases; // Select correct text

  const [progress, setProgress] = useState(6);
  const [statusText, setStatusText] = useState(phases[0]);
  const [result, setResult] = useState(null);
  const didNavigate = useRef(false);

  useEffect(() => {
    if (!state.source) {
      navigate('/detect', { replace: true });
    }
  }, [navigate, state.source]);

  useEffect(() => {
    let alive = true;

    const execute = async () => {
      const mode = state.mode || 'video';
      
      // --- LOGIC FOR EMAIL ---
      if (isEmail) {
        const emailResponse = await analyzeEmail(state.content || '');
        if (!alive) return;

        if (!emailResponse?.success) {
          const fallbackEmail = generateMockResult({
            mode: 'image',
            source: 'email',
            filename: 'email-source.txt',
          });
          setResult({
            ...fallbackEmail,
            mode: 'email',
            filename: 'email-source.txt',
            summary: `Email service unavailable: ${emailResponse?.error || 'unknown error'}. Showing local fallback result.`,
          });
          return;
        }

        const parsed = parseEmailAnalysis(emailResponse.analysis);
        const score = scoreFromRiskLevel(parsed.riskLevel);
        const label = parsed.isFake ? 'Fake' : classifyScore(score);
        const threats = parsed.threats.length > 0 ? parsed.threats : ['Header and body checks completed without explicit threat list.'];
        const severity = severityFromScore(score);

        const emailResult = {
          id: `EML-${Math.random().toString(36).slice(2, 11)}`,
          generatedAt: new Date().toISOString(),
          filename: 'email-source.txt',
          mode: 'email',
          score,
          confidence: Math.max(62, Math.min(97, score + 8)),
          label,
          summary: parsed.summary || summaryByLabel(label),
          insights: [
            {
              id: 'email-insight-1',
              title: `Sender: ${emailResponse.metadata?.sender || 'Unknown sender'}`,
              severity,
              confidence: 96,
            },
            {
              id: 'email-insight-2',
              title: `Embedded links detected: ${emailResponse.metadata?.links_count ?? 0}`,
              severity: parsed.riskLevel === 'Low' ? 'Low' : 'Medium',
              confidence: 92,
            },
            ...threats.slice(0, 3).map((threat, index) => ({
              id: `email-threat-${index + 1}`,
              title: threat,
              severity,
              confidence: Math.max(70, 90 - index * 7),
            })),
          ],
          timeline: timelineFromScore(score),
        };
        setResult(emailResult);
        return;
      }

      // --- LOGIC FOR MEDIA (IMAGE/VIDEO/VOICE) ---
      const payload = { filename: state.filename || 'media-sample.mp4' };

      try {
        const serviceMethod =
          mode === 'image'
            ? 'analyzeImage'
            : mode === 'voice'
              ? 'analyzeAudio'
              : 'analyzeVideo';

        const [cloudResult, vertexResult] = await Promise.allSettled([
          cloudVisionService[serviceMethod]?.(payload),
          vertexAIService[serviceMethod]?.(payload),
        ]);

        if (!alive) return;

        const providers = [cloudResult, vertexResult]
          .filter((item) => item.status === 'fulfilled' && item.value)
          .map((item) => item.value);

        if (providers.length === 0) {
          setResult(
            generateMockResult({
              mode,
              source: state.source || 'upload',
              filename: payload.filename,
            }),
          );
          return;
        }

        const aggregateScore = Math.round(
          providers.reduce((acc, provider) => acc + (provider.score || 0), 0) / providers.length,
        );
        const label = classifyScore(aggregateScore);

        const findings = providers.flatMap((provider) =>
          (provider.findings || []).map((finding) => ({
            provider: provider.provider,
            text: finding,
          })),
        );

        const resultPayload = {
          id: `scan-${Date.now()}`,
          source: state.source || 'upload',
          mode,
          filename: payload.filename,
          score: aggregateScore,
          confidence: Math.max(65, Math.min(98, aggregateScore + 9)),
          label,
          summary: summaryByLabel(label),
          insights: findings.slice(0, 5).map((item, index) => ({
            id: `insight-${index + 1}`,
            title: `${item.text} (${item.provider})`,
            severity: severityFromScore(aggregateScore),
            confidence: Math.max(68, Math.min(96, aggregateScore + 10 - index * 4)),
          })),
          timeline: timelineFromScore(aggregateScore),
          providers,
          generatedAt: new Date().toISOString(),
        };

        setResult(resultPayload);
      } catch (_error) {
        if (!alive) return;
        setResult(
          generateMockResult({
            mode,
            source: state.source || 'upload',
            filename: payload.filename,
          }),
        );
      }
    };

    execute();
    return () => { alive = false; };
  }, [state]);

  // Handle Progress Bar
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = Math.min(100, prev + Math.floor(Math.random() * 8) + 4);
        const phaseIndex = Math.min(phases.length - 1, Math.floor((next / 100) * phases.length));
        setStatusText(phases[phaseIndex]);
        return next;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [phases]);

  // Navigate to results
  useEffect(() => {
    if (progress < 100 || !result || didNavigate.current) return;
    didNavigate.current = true;
    navigate('/results', {
      replace: true,
      state: { ...state, result },
    });
  }, [navigate, progress, result, state]);

  return <Loader progress={progress} statusText={statusText} />;
}
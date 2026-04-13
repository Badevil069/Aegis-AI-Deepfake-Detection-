import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { generateMockResult } from '../data/mockData';
import * as cloudVisionService from '../services/cloudVision';
import * as vertexAIService from '../services/vertexAI';

const phases = [
  'Extracting frames...',
  'Analyzing audio...',
  'Detecting inconsistencies...',
  'Scoring synthetic likelihood...',
  'Compiling secure report...',
];

const documentPhases = [
  'Extracting OCR and metadata...',
  'Inspecting tamper indicators...',
  'Cross-checking structural integrity...',
  'Scoring forgery probability...',
  'Compiling document audit report...',
];

const DOCUMENT_ANALYSIS_TIMEOUT_MS = 20000;

function classifyScore(score) {
  if (score >= 75) return 'Fake';
  if (score >= 45) return 'Suspicious';
  return 'Real';
}

function summaryByLabel(label) {
  if (label === 'Fake') {
    return 'High-risk synthetic signatures detected. Immediate manual verification is recommended.';
  }
  if (label === 'Suspicious') {
    return 'Anomalous signals detected across multiple modalities. Secondary review is advised.';
  }
  return 'No critical deepfake markers detected in this pass.';
}

async function runPlaceholderAnalysis(mode, payload) {
  const normalizedMode =
    mode === 'document'
      ? 'document'
      : mode === 'image'
        ? 'image'
        : mode === 'voice'
          ? 'voice'
          : 'video';

  const cloudFn =
    normalizedMode === 'image' || normalizedMode === 'document'
      ? cloudVisionService.analyzeImage
      : normalizedMode === 'voice'
        ? cloudVisionService.analyzeAudio
        : cloudVisionService.analyzeVideo;

  const vertexFn =
    normalizedMode === 'image' || normalizedMode === 'document'
      ? vertexAIService.analyzeImage
      : normalizedMode === 'voice'
        ? vertexAIService.analyzeAudio
        : vertexAIService.analyzeVideo;

  const [cloud, vertex] = await Promise.all([cloudFn(payload), vertexFn(payload)]);

  return {
    normalizedMode: mode === 'live' ? 'live' : normalizedMode,
    cloud,
    vertex,
  };
}

async function runDocumentAnalysis(file, timeoutMs = DOCUMENT_ANALYSIS_TIMEOUT_MS) {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Document analysis failed');
    }

    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Document analysis timed out while waiting for the backend.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function documentVerdict(result) {
  const audit = result?.cloud_vision_audit || {};
  const visual = result?.gemini_visual_scan || {};
  const tampered = Boolean(audit.is_tampered || visual.is_deepfake);
  const details = (audit.details || []).map((d) => String(d).toLowerCase());
  const uncertainBackend = details.some((d) => d.includes('error during cloud vision analysis') || d.includes('cloud vision api unavailable'));

  if (tampered) return 'Fake';
  if (uncertainBackend) return 'Suspicious';
  if (audit.metadata_integrity === false) return 'Suspicious';
  return 'Real';
}

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useMemo(() => location.state || {}, [location.state]);
  const [progress, setProgress] = useState(6);
  const activePhases = state.mode === 'document' ? documentPhases : phases;
  const [statusText, setStatusText] = useState(activePhases[0]);
  const [result, setResult] = useState(null);
  const didNavigate = useRef(false);

  useEffect(() => {
    let alive = true;

    const execute = async () => {
      const mode = state.mode || 'video';
      const payload = {
        filename: state.filename || (mode === 'voice' ? 'voice-sample.wav' : mode === 'document' ? 'document-sample.pdf' : 'media-sample.mp4'),
      };

      if (mode === 'document' && state.file) {
        try {
          const backendResult = await runDocumentAnalysis(state.file);
          if (!alive) return;

          const audit = backendResult.cloud_vision_audit || {};
          const visual = backendResult.gemini_visual_scan || {};
          const label = documentVerdict(backendResult);
          const localScore = Number(audit?.metadata?.local_metadata_score || 0);
          const score = label === 'Fake' ? Math.max(82, Math.min(96, 75 + localScore * 5)) : label === 'Suspicious' ? 52 : Math.min(28, 14 + localScore * 6);

          setResult({
            id: `doc-${Date.now()}`,
            source: state.source || 'upload',
            mode: 'document',
            filename: backendResult.filename || payload.filename,
            score,
            confidence: Math.min(99, Math.max(62, audit.metadata_integrity === false ? 72 : 91)),
            label,
            summary:
              label === 'Fake'
                ? 'Document tampering or spoofing signals were detected.'
                : label === 'Suspicious'
                  ? 'The file looks mostly valid, but some metadata signals need review.'
                  : 'No strong tampering indicators were found in this document scan.',
            insights: [
              ...(audit.details || []).map((detail, index) => ({
                id: `audit-${index + 1}`,
                title: detail,
                severity: audit.is_tampered ? 'High' : 'Medium',
                confidence: 92 - index * 4,
              })),
              ...(visual.details || []).map((detail, index) => ({
                id: `visual-${index + 1}`,
                title: detail,
                severity: visual.is_deepfake ? 'High' : 'Low',
                confidence: 88 - index * 5,
              })),
            ],
            timeline: [18, 24, 31, 44, 53, 49, 62, 68, 71, 76, 81, 86, 90, 94],
            generatedAt: new Date().toISOString(),
            providers: [
              {
                provider: 'Cloud Vision Audit',
                mode: 'document',
                score: audit.is_tampered ? 90 : 20,
                findings: audit.details || [],
              },
              {
                provider: 'Gemini Visual Scan',
                mode: 'document',
                score: visual.is_deepfake ? 85 : 25,
                findings: visual.details || [],
              },
            ],
            cloud_vision_audit: audit,
            gemini_visual_scan: visual,
          });

          return;
        } catch (error) {
          if (!alive) return;

          const fallback = generateMockResult({
            mode: 'document',
            source: state.source || 'upload',
            filename: state.filename || payload.filename,
          });

          setResult({
            ...fallback,
            summary: `Document analysis fallback: ${error?.message || 'backend unavailable'}.`,
            providers: [],
            cloud_vision_audit: {},
            gemini_visual_scan: {},
          });

          return;
        }
      }

      if (mode === 'document' && !state.file) {
        setResult({
          id: `doc-missing-${Date.now()}`,
          source: state.source || 'upload',
          mode: 'document',
          filename: state.filename || 'document',
          score: 35,
          confidence: 60,
          label: 'Suspicious',
          summary: 'Document file payload was missing after navigation. Please re-upload and analyze again.',
          insights: [
            {
              id: 'doc-missing-1',
              title: 'File object not available in processing state.',
              severity: 'Medium',
              confidence: 72,
            },
          ],
          timeline: [20, 26, 30, 28, 35, 33, 38, 35, 37, 34, 36, 33, 35, 34],
          generatedAt: new Date().toISOString(),
          providers: [],
          cloud_vision_audit: {},
          gemini_visual_scan: {},
        });
        return;
      }

      const placeholder = await runPlaceholderAnalysis(mode, payload);
      if (!alive) return;

      const base = generateMockResult({
        mode: placeholder.normalizedMode,
        source: state.source || (mode === 'live' ? 'live' : 'upload'),
        filename: payload.filename,
      });

      const averaged = Math.round((base.score + placeholder.cloud.score + placeholder.vertex.score) / 3);
      const label = classifyScore(averaged);

      const merged = {
        ...base,
        score: averaged,
        label,
        summary: summaryByLabel(label),
        insights: base.insights.map((insight, idx) => ({
          ...insight,
          confidence: Math.min(99, Math.max(56, Math.round((insight.confidence + placeholder.vertex.score - idx * 2) / 1.2))),
        })),
        providers: [placeholder.cloud, placeholder.vertex],
      };

      setResult(merged);
    };

    execute();

    return () => {
      alive = false;
    };
  }, [state.file, state.filename, state.mode, state.source]);

  useEffect(() => {
    setStatusText(activePhases[0]);
  }, [activePhases]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = Math.min(100, prev + Math.floor(Math.random() * 12) + 6);
        const phaseIndex = Math.min(activePhases.length - 1, Math.floor((next / 100) * activePhases.length));
        setStatusText(activePhases[phaseIndex]);
        return next;
      });
    }, 620);

    return () => clearInterval(timer);
  }, [activePhases]);

  useEffect(() => {
    if (progress < 100 || !result || didNavigate.current) return;

    didNavigate.current = true;
    navigate('/results', {
      replace: true,
      state: {
        ...state,
        result,
      },
    });
  }, [navigate, progress, result, state]);

  return <Loader progress={progress} statusText={statusText} />;
}

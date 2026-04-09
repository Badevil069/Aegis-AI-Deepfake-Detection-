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
  const normalizedMode = mode === 'image' ? 'image' : mode === 'voice' ? 'voice' : 'video';

  const cloudFn =
    normalizedMode === 'image'
      ? cloudVisionService.analyzeImage
      : normalizedMode === 'voice'
        ? cloudVisionService.analyzeAudio
        : cloudVisionService.analyzeVideo;

  const vertexFn =
    normalizedMode === 'image'
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

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useMemo(() => location.state || {}, [location.state]);
  const [progress, setProgress] = useState(6);
  const [statusText, setStatusText] = useState(phases[0]);
  const [result, setResult] = useState(null);
  const didNavigate = useRef(false);

  useEffect(() => {
    let alive = true;

    const execute = async () => {
      const mode = state.mode || 'video';
      const payload = {
        filename: state.filename || (mode === 'voice' ? 'voice-sample.wav' : 'media-sample.mp4'),
      };

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
  }, [state.filename, state.mode, state.source]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = Math.min(100, prev + Math.floor(Math.random() * 12) + 6);
        const phaseIndex = Math.min(phases.length - 1, Math.floor((next / 100) * phases.length));
        setStatusText(phases[phaseIndex]);
        return next;
      });
    }, 620);

    return () => clearInterval(timer);
  }, []);

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

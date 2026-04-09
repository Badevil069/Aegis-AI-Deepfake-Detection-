export const navItems = [
  { label: 'Home', path: '/' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Detect', path: '/detect' },
  { label: 'Live', path: '/live' },
  { label: 'Results', path: '/results' },
  { label: 'Use Cases', path: '/use-cases' },
  { label: 'Contact', path: '/contact' },
];

export const homeStats = [
  { label: 'Media Scans', value: '1.8M+' },
  { label: 'Avg. Detection Time', value: '6.4s' },
  { label: 'False Positive Rate', value: '1.2%' },
  { label: 'Enterprise Uptime', value: '99.99%' },
];

export const howItWorksSteps = [
  {
    title: 'Upload / Capture',
    description: 'Ingest image, video, audio, or a live session stream in a secure sandbox.',
  },
  {
    title: 'AI Analysis',
    description: 'Multimodal models inspect visual, acoustic, and temporal forensic signals.',
  },
  {
    title: 'Pattern Detection',
    description: 'The system maps anomalies against known deepfake and voice-cloning signatures.',
  },
  {
    title: 'Result Generation',
    description: 'A scored report is produced with confidence, insights, and recommended action.',
  },
];

export const useCases = [
  {
    title: 'Journalism Verification',
    description: 'Validate public footage and interview clips before publication.',
  },
  {
    title: 'Fraud Detection',
    description: 'Catch impersonation attempts in onboarding and payment verification flows.',
  },
  {
    title: 'Social Media Moderation',
    description: 'Flag synthetic media at scale to protect platform trust.',
  },
  {
    title: 'Law Enforcement',
    description: 'Assist forensic review teams with fast anomaly triage and reporting.',
  },
];

export const liveLogSeeds = [
  'Capturing frame batch from primary feed...',
  'Running facial landmark consistency scan...',
  'Cross-checking lip cadence with phoneme map...',
  'Voiceprint drift detected on speaker channel...',
  'Temporal artifact threshold nearing alert zone...',
  'Neural consensus model confidence updated.',
  'No codec-level corruption found in current segment.',
  'Escalating suspicious confidence to analyst view.',
];

export const participantTiles = [
  { name: 'Lead Analyst', role: 'Host' },
  { name: 'Witness Feed', role: 'Guest' },
  { name: 'Compliance', role: 'Observer' },
  { name: 'Recorder', role: 'Bot' },
];

const insightTemplates = {
  video: [
    'Face inconsistency around left cheek under motion.',
    'Lip-sync mismatch during high-energy phonemes.',
    'Temporal blending artifacts in transition frames.',
  ],
  image: [
    'Specular highlights conflict with scene lighting.',
    'Edge halos around subject silhouette.',
    'Background texture repetition suggests synthesis.',
  ],
  voice: [
    'Synthetic harmonics detected in upper mids.',
    'Breath envelope appears statistically uniform.',
    'Prosody jitter diverges from natural speech.',
  ],
  live: [
    'Frame-by-frame variance spikes during head turns.',
    'Voiceprint confidence fluctuates between channels.',
    'Latency artifacts indicate possible relay manipulation.',
  ],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function classifyScore(score) {
  if (score >= 75) return 'Fake';
  if (score >= 45) return 'Suspicious';
  return 'Real';
}

function confidenceFromScore(score) {
  return Math.min(99, Math.max(61, score + randomInt(3, 14)));
}

export function generateMockResult({
  mode = 'video',
  source = 'upload',
  filename = 'sample-media',
} = {}) {
  const ranges = {
    video: [42, 92],
    image: [34, 90],
    voice: [40, 95],
    live: [48, 97],
  };

  const [min, max] = ranges[mode] || ranges.video;
  const score = randomInt(min, max);
  const label = classifyScore(score);
  const confidence = confidenceFromScore(score);

  const timeline = Array.from({ length: 12 }, (_, index) => {
    const center = score + Math.sin(index / 2) * randomInt(2, 9);
    return Math.min(98, Math.max(6, Math.round(center + randomInt(-7, 7))));
  });

  const insights = (insightTemplates[mode] || insightTemplates.video).map((summary, idx) => ({
    id: `${mode}-insight-${idx + 1}`,
    title: summary,
    severity: score >= 75 ? (idx === 0 ? 'High' : 'Medium') : score >= 45 ? 'Medium' : 'Low',
    confidence: Math.min(98, Math.max(57, confidence - idx * randomInt(4, 9))),
  }));

  return {
    id: `scan-${Date.now()}`,
    source,
    mode,
    filename,
    score,
    confidence,
    label,
    summary:
      label === 'Fake'
        ? 'High-risk synthetic patterns detected. Escalate for manual verification.'
        : label === 'Suspicious'
          ? 'Multiple anomalous signals detected. Recommend secondary review.'
          : 'No critical synthetic artifacts detected in the analyzed sample.',
    insights,
    timeline,
    generatedAt: new Date().toISOString(),
  };
}

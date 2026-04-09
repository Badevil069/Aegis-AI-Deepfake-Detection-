// Insert your Vertex AI API key here
const VERTEX_AI_API_KEY = 'Insert your Vertex AI API key here';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function makeResponse(mode, filename) {
  const modeMap = {
    image: {
      score: 64,
      findings: ['GAN-style texture residue identified in high-contrast regions.', 'Pose consistency remains partially plausible.'],
    },
    video: {
      score: 73,
      findings: ['Lip-sync alignment drift detected during rapid speech segments.', 'Temporal smoothing indicates synthetic interpolation.'],
    },
    voice: {
      score: 78,
      findings: ['Voiceprint drift aligns with known cloning signatures.', 'Prosody variance appears computationally constrained.'],
    },
  };

  return {
    provider: 'Vertex AI Placeholder',
    apiKeyConfigured: VERTEX_AI_API_KEY !== 'Insert your Vertex AI API key here',
    mode,
    filename,
    ...modeMap[mode],
  };
}

export async function analyzeImage(payload = {}) {
  await wait(1000);
  return makeResponse('image', payload.filename || 'uploaded-image.jpg');
}

export async function analyzeVideo(payload = {}) {
  await wait(1200);
  return makeResponse('video', payload.filename || 'uploaded-video.mp4');
}

export async function analyzeAudio(payload = {}) {
  await wait(1000);
  return makeResponse('voice', payload.filename || 'uploaded-audio.wav');
}

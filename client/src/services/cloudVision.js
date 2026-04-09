// Insert your Cloud Vision API key here
const CLOUD_VISION_API_KEY = 'Insert your Cloud Vision API key here';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function makeResponse(mode, filename) {
  const modeMap = {
    image: {
      score: 58,
      findings: ['Pixel-level edge anomalies detected near facial contours.', 'Metadata timestamps are internally consistent.'],
    },
    video: {
      score: 67,
      findings: ['Frame entropy spikes detected in motion transitions.', 'Compression profile differs from source baseline.'],
    },
    voice: {
      score: 61,
      findings: ['Spectral harmonics suggest possible synthetic generation.', 'Background noise floor appears artificially uniform.'],
    },
  };

  return {
    provider: 'Cloud Vision Placeholder',
    apiKeyConfigured: CLOUD_VISION_API_KEY !== 'Insert your Cloud Vision API key here',
    mode,
    filename,
    ...modeMap[mode],
  };
}

export async function analyzeImage(payload = {}) {
  await wait(900);
  return makeResponse('image', payload.filename || 'uploaded-image.jpg');
}

export async function analyzeVideo(payload = {}) {
  await wait(1100);
  return makeResponse('video', payload.filename || 'uploaded-video.mp4');
}

export async function analyzeAudio(payload = {}) {
  await wait(1000);
  return makeResponse('voice', payload.filename || 'uploaded-audio.wav');
}

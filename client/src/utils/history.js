export function saveDetectionResult(result) {
  try {
    const existing = getDetectionHistory();
    // Ensure we don't save duplicates if the same ID is passed
    if (existing.some(r => r.id === result.id)) return;
    
    const updated = [result, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem('aegis_history', JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save to history", e);
  }
}

export function getDetectionHistory() {
  try {
    const data = localStorage.getItem('aegis_history');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
}

export function clearDetectionHistory() {
  localStorage.removeItem('aegis_history');
}

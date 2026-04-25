import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Globe, Users } from 'lucide-react';

import useDetectionSocket from '../../hooks/useDetectionSocket';
import useWebRTC from '../../hooks/useWebRTC';

import WebcamMode from './WebcamMode';
import StreamMode from './StreamMode';
import WebRTCMode from './WebRTCMode';
import DetectionSidebar from './DetectionSidebar';

const MODES = [
  { id: 'webcam', label: 'Webcam', icon: Camera, desc: 'Real-time camera detection' },
  { id: 'stream', label: 'Stream', icon: Globe, desc: 'YouTube / Twitch analysis' },
  { id: 'webrtc', label: 'Live Call', icon: Users, desc: 'Multi-user video call' },
];

/**
 * LiveDetectionHub — master component for the /live page.
 * Manages mode switching between Webcam, Stream, and WebRTC detection.
 * All modes share the same detection sidebar (risk score, timeline, logs).
 */
export default function LiveDetectionHub() {
  const [activeMode, setActiveMode] = useState('webcam');

  // Shared detection socket (manages WebSocket, logs, timeline data)
  const {
    socket,
    connected,
    latestResult,
    logs,
    timelineData,
    streamStatus,
    streamSessionId,
    sendFrame,
    sendWebRTCFrame,
    ingestLiveCallResult,
    startStream,
    stopStream,
    clearData,
    addLog,
    updateLatestResult,
  } = useDetectionSocket();

  // WebRTC hook (manages peer connections, rooms)
  const {
    localStream,
    participants,
    inRoom,
    joinRoom,
    leaveRoom,
  } = useWebRTC(socket, connected);

  const handleModeSwitch = (modeId) => {
    if (modeId === activeMode) return;
    setActiveMode(modeId);
    clearData();
    addLog('info', `Switched to ${MODES.find((m) => m.id === modeId)?.label} mode.`);
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="glass-card p-2">
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = mode.id === activeMode;
            return (
              <button
                key={mode.id}
                id={`mode-${mode.id}`}
                onClick={() => handleModeSwitch(mode.id)}
                className={[
                  'relative rounded-xl px-4 py-3 text-left transition-all duration-300 overflow-hidden',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]',
                ].join(' ')}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mode-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-cyan/15 to-brand-indigo/10 border border-brand-cyan/30"
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  />
                )}
                <div className="relative flex items-center gap-3">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? 'bg-brand-cyan/20 text-brand-cyan shadow-neon-cyan'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p className="text-[10px] text-slate-500">{mode.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content grid: Mode panel + Detection sidebar */}
      <section className="grid gap-4 lg:grid-cols-12">
        {/* Left: Active mode panel */}
        <div className="lg:col-span-7 xl:col-span-8">
          <AnimatePresence mode="wait">
            {activeMode === 'webcam' && (
              <motion.div
                key="webcam"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <WebcamMode sendFrame={sendFrame} addLog={addLog} />
              </motion.div>
            )}

            {activeMode === 'stream' && (
              <motion.div
                key="stream"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <StreamMode
                  startStream={startStream}
                  stopStream={stopStream}
                  streamStatus={streamStatus}
                  streamSessionId={streamSessionId}
                  addLog={addLog}
                />
              </motion.div>
            )}

            {activeMode === 'webrtc' && (
              <motion.div
                key="webrtc"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <WebRTCMode
                  socket={socket}
                  localStream={localStream}
                  participants={participants}
                  inRoom={inRoom}
                  joinRoom={joinRoom}
                  leaveRoom={leaveRoom}
                  sendWebRTCFrame={sendWebRTCFrame}
                  addLog={addLog}
                  updateLatestResult={updateLatestResult}
                  latestResult={latestResult}
                  timelineData={timelineData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Detection Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4">
          <DetectionSidebar
            latestResult={latestResult}
            logs={logs}
            timelineData={timelineData}
            connected={connected}
          />
        </div>
      </section>
    </div>
  );
}

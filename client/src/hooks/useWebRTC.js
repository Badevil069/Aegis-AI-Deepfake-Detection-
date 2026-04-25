import { useCallback, useEffect, useRef, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * useWebRTC — manages WebRTC peer connections via Socket.IO signaling.
 *
 * @param {object} socket — Socket.IO instance from useDetectionSocket
 * @param {boolean} connected — whether the socket is connected
 */
export default function useWebRTC(socket, connected) {
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]); // [{ sid, username, stream, pc }]
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);

  const peersRef = useRef({}); // sid → { pc, stream }
  const localStreamRef = useRef(null);

  // ── Start local media ──
  const startLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('getUserMedia(video+audio) failed, retrying with video-only:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (fallbackErr) {
        console.error('getUserMedia(video-only) failed:', fallbackErr);
        return null;
      }
    }
  }, []);

  // ── Stop local media ──
  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  // ── Create peer connection ──
  const createPeerConnection = useCallback(
    (remoteSid, remoteUsername) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc_ice', {
            target: remoteSid,
            candidate: event.candidate,
          });
        }
      };

      // Remote stream
      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        setParticipants((prev) =>
          prev.map((p) => (p.sid === remoteSid ? { ...p, stream: remoteStream } : p)),
        );
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          removePeer(remoteSid);
        }
      };

      peersRef.current[remoteSid] = { pc, stream: remoteStream };

      setParticipants((prev) => {
        if (prev.find((p) => p.sid === remoteSid)) return prev;
        return [...prev, { sid: remoteSid, username: remoteUsername || `User-${remoteSid.slice(0, 6)}`, stream: remoteStream }];
      });

      return pc;
    },
    [socket], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Remove peer ──
  const removePeer = useCallback((sid) => {
    const peer = peersRef.current[sid];
    if (peer) {
      peer.pc.close();
      delete peersRef.current[sid];
    }
    setParticipants((prev) => prev.filter((p) => p.sid !== sid));
  }, []);

  // ── Join room ──
  const joinRoom = useCallback(
    async (room, username) => {
      if (!socket || !connected) return false;

      const stream = await startLocalMedia();
      if (!stream) return false;

      setRoomId(room);
      socket.emit('join_room', { room_id: room, username });
      setInRoom(true);
      return true;
    },
    [socket, connected, startLocalMedia],
  );

  // ── Leave room ──
  const leaveRoom = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('leave_room', { room_id: roomId });

    // Close all peer connections
    Object.keys(peersRef.current).forEach((sid) => {
      peersRef.current[sid].pc.close();
    });
    peersRef.current = {};
    setParticipants([]);
    setInRoom(false);
    setRoomId('');
    stopLocalMedia();
  }, [socket, roomId, stopLocalMedia]);

  // ── Socket.IO event handlers ──
  useEffect(() => {
    if (!socket) return;

    // When we join a room, get existing participants and create offers
    const handleRoomJoined = async (data) => {
      for (const participant of data.participants || []) {
        const pc = createPeerConnection(participant.sid, participant.username);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
          target: participant.sid,
          sdp: pc.localDescription,
        });
      }
    };

    // New participant joined — wait for their offer
    const handleParticipantJoined = (data) => {
      createPeerConnection(data.sid, data.username);
    };

    // Participant left
    const handleParticipantLeft = (data) => {
      removePeer(data.sid);
    };

    // Receive offer → create answer
    const handleOffer = async (data) => {
      let peer = peersRef.current[data.from];
      if (!peer) {
        createPeerConnection(data.from, 'Remote');
        peer = peersRef.current[data.from];
      }
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', {
        target: data.from,
        sdp: peer.pc.localDescription,
      });
    };

    // Receive answer
    const handleAnswer = async (data) => {
      const peer = peersRef.current[data.from];
      if (peer) {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    };

    // Receive ICE candidate
    const handleICE = async (data) => {
      const peer = peersRef.current[data.from];
      if (peer) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.warn('ICE candidate error:', e);
        }
      }
    };

    socket.on('room_joined', handleRoomJoined);
    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice', handleICE);

    return () => {
      socket.off('room_joined', handleRoomJoined);
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice', handleICE);
    };
  }, [socket, createPeerConnection, removePeer]);

  return {
    localStream,
    participants,
    roomId,
    inRoom,
    joinRoom,
    leaveRoom,
    startLocalMedia,
    stopLocalMedia,
  };
}

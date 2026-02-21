import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Free STUN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

type SignalPayload =
    | { type: 'offer'; sdp: string; senderId: string }
    | { type: 'answer'; sdp: string; senderId: string }
    | { type: 'ice-candidate'; candidate: RTCIceCandidateInit; senderId: string }
    | { type: 'user-joined'; senderId: string; role: string }
    | { type: 'hangup'; senderId: string };

interface UseWebRTCOptions {
    roomId: string;
    userId: string;
    userRole: string;
}

export function useWebRTC({ roomId, userId, userRole }: UseWebRTCOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [connectionState, setConnectionState] = useState<string>('new');
    const [remoteUserRole, setRemoteUserRole] = useState<string>('');

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const makingOffer = useRef(false);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

    // Broadcast a signaling message
    const sendSignal = useCallback((payload: SignalPayload) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload,
        });
    }, []);

    // Create a new peer connection
    const createPeerConnection = useCallback((stream: MediaStream) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to the connection
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle incoming remote tracks
        const remote = new MediaStream();
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remote.addTrack(track);
            });
            setRemoteStream(remote);
        };

        // Send ICE candidates to the remote peer
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({
                    type: 'ice-candidate',
                    candidate: event.candidate.toJSON(),
                    senderId: userId,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            setConnectionState(pc.connectionState);
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
            }
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                setIsConnected(false);
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [userId, sendSignal]);

    // Handle incoming signaling messages
    const handleSignal = useCallback(async (payload: SignalPayload) => {
        // Ignore our own messages
        if (payload.senderId === userId) return;

        const pc = peerConnection.current;

        if (payload.type === 'user-joined') {
            setRemoteUserRole(payload.role);
            // When someone else joins, create an offer if we don't already have a connection
            if (pc && pc.signalingState === 'stable' && !makingOffer.current) {
                try {
                    makingOffer.current = true;
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sendSignal({
                        type: 'offer',
                        sdp: pc.localDescription!.sdp,
                        senderId: userId,
                    });
                } catch (err) {
                    console.error('Error creating offer:', err);
                } finally {
                    makingOffer.current = false;
                }
            }
        }

        if (payload.type === 'offer' && pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.sdp }));
                // Flush pending candidates
                for (const candidate of pendingCandidates.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.current = [];

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({
                    type: 'answer',
                    sdp: pc.localDescription!.sdp,
                    senderId: userId,
                });
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        }

        if (payload.type === 'answer' && pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }));
                // Flush pending candidates
                for (const candidate of pendingCandidates.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.current = [];
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        }

        if (payload.type === 'ice-candidate' && pc) {
            try {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } else {
                    // Queue candidate if remote description not yet set
                    pendingCandidates.current.push(payload.candidate);
                }
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        }

        if (payload.type === 'hangup') {
            // Remote user hung up
            pc?.close();
            peerConnection.current = null;
            setRemoteStream(null);
            setIsConnected(false);
            setConnectionState('closed');
        }
    }, [userId, sendSignal]);

    // Initialize: get media, set up signaling channel, create peer connection
    const initialize = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: { echoCancellation: true, noiseSuppression: true },
            });
            setLocalStream(stream);

            createPeerConnection(stream);

            // Set up Supabase Realtime channel for signaling
            const channel = supabase.channel(`video-room-${roomId}`, {
                config: { broadcast: { self: false } },
            });

            channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
                handleSignal(payload as SignalPayload);
            });

            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Announce presence
                    sendSignal({ type: 'user-joined', senderId: userId, role: userRole });
                }
            });

            channelRef.current = channel;
        } catch (err) {
            console.error('Failed to initialize WebRTC:', err);
            throw err;
        }
    }, [roomId, userId, userRole, createPeerConnection, handleSignal, sendSignal]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(prev => !prev);
        }
    }, [localStream]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(prev => !prev);
        }
    }, [localStream]);

    // Hang up
    const hangUp = useCallback(() => {
        sendSignal({ type: 'hangup', senderId: userId });
        peerConnection.current?.close();
        peerConnection.current = null;
        localStream?.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setConnectionState('closed');
    }, [userId, localStream, sendSignal]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            peerConnection.current?.close();
            localStream?.getTracks().forEach(t => t.stop());
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [localStream]);

    return {
        localStream,
        remoteStream,
        isConnected,
        isAudioEnabled,
        isVideoEnabled,
        connectionState,
        remoteUserRole,
        initialize,
        toggleAudio,
        toggleVideo,
        hangUp,
    };
}

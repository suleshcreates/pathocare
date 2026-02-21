import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    Loader2, ShieldAlert, Clock, User, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface RoomInfo {
    appointmentId: string;
    doctorName: string;
    patientName: string;
    doctorId: string;
    patientId: string;
    slotDate: string;
    startTime: string;
    endTime: string;
}

export function VideoRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuth();

    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [authorized, setAuthorized] = useState<boolean | null>(null); // null = loading
    const [callDuration, setCallDuration] = useState(0);
    const [hasEnded, setHasEnded] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const {
        localStream,
        remoteStream,
        isConnected,
        isAudioEnabled,
        isVideoEnabled,
        connectionState,
        initialize,
        toggleAudio,
        toggleVideo,
        hangUp,
    } = useWebRTC({
        roomId: roomId || '',
        userId: user?.id || '',
        userRole: role || 'patient',
    });

    // Validate room access
    useEffect(() => {
        const validateRoom = async () => {
            if (!roomId || !user?.id) {
                setAuthorized(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('doctor_appointments')
                    .select(`
                        appointment_id,
                        doctor_id, patient_id,
                        slot_date, start_time, end_time,
                        doctor:doctor_id ( full_name ),
                        patient:patient_id ( full_name )
                    `)
                    .eq('meeting_room_id', roomId)
                    .in('status', ['scheduled', 'ongoing'])
                    .single();

                if (error || !data) {
                    setAuthorized(false);
                    return;
                }

                // Verify the current user is either the doctor or patient
                if (data.doctor_id !== user.id && data.patient_id !== user.id) {
                    setAuthorized(false);
                    return;
                }

                setRoomInfo({
                    appointmentId: data.appointment_id,
                    doctorName: (data.doctor as any)?.full_name || 'Doctor',
                    patientName: (data.patient as any)?.full_name || 'Patient',
                    doctorId: data.doctor_id,
                    patientId: data.patient_id,
                    slotDate: data.slot_date,
                    startTime: data.start_time,
                    endTime: data.end_time,
                });
                setAuthorized(true);
            } catch (err) {
                console.error('Room validation failed:', err);
                setAuthorized(false);
            }
        };

        validateRoom();
    }, [roomId, user?.id]);

    // Initialize WebRTC once authorized
    useEffect(() => {
        if (authorized) {
            initialize().catch(err => console.error('WebRTC init failed:', err));
        }
    }, [authorized, initialize]);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Call duration timer
    useEffect(() => {
        if (isConnected && !timerRef.current) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isConnected]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleHangUp = async () => {
        hangUp();
        setHasEnded(true);

        // Optionally update appointment status to 'completed'
        if (roomInfo) {
            try {
                await supabase
                    .from('doctor_appointments')
                    .update({ status: 'completed' })
                    .eq('appointment_id', roomInfo.appointmentId);
            } catch (err) {
                console.error('Failed to update appointment status:', err);
            }
        }
    };

    // --- RENDER ---

    // Loading state
    if (authorized === null) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
                <p className="text-slate-300">Verifying room access...</p>
            </div>
        );
    }

    // Unauthorized
    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6 p-8">
                <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-10 h-10 text-rose-400" />
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-slate-400 text-center max-w-md">
                    This room doesn't exist or you don't have permission to access it.
                    Only the assigned doctor and patient can join this call.
                </p>
                <Button onClick={() => navigate('/dashboard')} className="bg-teal-600 hover:bg-teal-700">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    // Call ended
    if (hasEnded) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6 p-8">
                <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center">
                    <PhoneOff className="w-10 h-10 text-teal-400" />
                </div>
                <h1 className="text-2xl font-bold">Call Ended</h1>
                <p className="text-slate-400 text-center max-w-md">
                    Duration: {formatDuration(callDuration)}
                </p>
                <Button onClick={() => navigate('/dashboard')} className="bg-teal-600 hover:bg-teal-700">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    // Main video call UI
    const isDoctor = user?.id === roomInfo?.doctorId;

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden select-none">
            {/* Remote Video (Full Screen) */}
            <div className="flex-1 relative">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover absolute inset-0"
                    />
                ) : (
                    <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 gap-6">
                        <div className="w-28 h-28 bg-slate-700 rounded-full flex items-center justify-center animate-pulse">
                            {isDoctor
                                ? <User className="w-14 h-14 text-slate-500" />
                                : <Stethoscope className="w-14 h-14 text-slate-500" />
                            }
                        </div>
                        <div className="text-center">
                            <p className="text-white text-lg font-medium">
                                Waiting for {isDoctor ? roomInfo?.patientName : `Dr. ${roomInfo?.doctorName}`}...
                            </p>
                            <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4" />
                                {connectionState === 'new' ? 'Connecting...' : connectionState}
                            </p>
                        </div>
                    </div>
                )}

                {/* Top bar - Appointment info */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"
                            )} />
                            <span className="text-white text-sm font-medium">
                                {isConnected
                                    ? `Connected — ${formatDuration(callDuration)}`
                                    : 'Connecting...'
                                }
                            </span>
                        </div>
                        <div className="text-white/70 text-sm hidden sm:block">
                            {isDoctor
                                ? `Patient: ${roomInfo?.patientName}`
                                : `Dr. ${roomInfo?.doctorName}`
                            }
                        </div>
                    </div>
                </div>

                {/* Local Video (PiP) */}
                <div className="absolute bottom-24 right-4 w-40 h-28 sm:w-56 sm:h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 bg-slate-800">
                    {localStream ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                        </div>
                    )}
                    {!isVideoEnabled && localStream && (
                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-slate-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                    <button
                        onClick={toggleAudio}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                            isAudioEnabled
                                ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                                : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                        )}
                        title={isAudioEnabled ? 'Mute' : 'Unmute'}
                    >
                        {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                            isVideoEnabled
                                ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                                : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                        )}
                        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={handleHangUp}
                        className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white shadow-xl shadow-rose-600/40 transition-all hover:scale-105"
                        title="End call"
                    >
                        <PhoneOff className="w-7 h-7" />
                    </button>
                </div>
            </div>
        </div>
    );
}

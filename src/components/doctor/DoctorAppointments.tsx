import { useState, useEffect } from 'react';
import {
    Calendar, Clock, Video, Building2, Users, MessageSquare,
    Loader2, CheckCircle2, XCircle, PlayCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { doctorService } from '@/services/doctorService';
import { sendApprovalEmail } from '@/services/emailService';
import { toast } from 'sonner';
import type { DoctorAppointment } from '@/types';



export function DoctorAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [notesDialog, setNotesDialog] = useState<{ open: boolean; appointmentId: string; patientId: string }>({ open: false, appointmentId: '', patientId: '' });
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAppointments = async () => {
        if (!user?.id) return;
        try {
            const data = await doctorService.getDoctorAppointments(user.id);
            setAppointments(data);
        } catch (err) {
            console.error('Failed to load appointments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, [user?.id]);

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        if (!user?.id) return;
        try {
            toast.loading('Updating...', { id: 'status' });
            await doctorService.updateAppointmentStatus(appointmentId, newStatus, user.id);
            toast.success(`Appointment marked as ${newStatus}`, { id: 'status' });
            fetchAppointments();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update', { id: 'status' });
        }
    };

    const handleAddNote = async () => {
        if (!user?.id || !noteText.trim()) return;
        setSaving(true);
        try {
            await doctorService.addNote({
                appointmentId: notesDialog.appointmentId,
                doctorId: user.id,
                patientId: notesDialog.patientId,
                note: noteText
            });
            toast.success('Note added successfully');
            setNotesDialog({ open: false, appointmentId: '', patientId: '' });
            setNoteText('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to add note');
        } finally {
            setSaving(false);
        }
    };

    const handleAcceptRequest = async (appt: DoctorAppointment) => {
        if (!user?.id) return;
        try {
            toast.loading('Approving request...', { id: 'status' });

            // 1. Approve in DB
            await doctorService.approveAppointment(appt.appointmentId);

            // 2. Send Email via EmailJS
            const dateStr = appt.slotDate ? new Date(appt.slotDate).toLocaleDateString() : 'N/A';
            const timeStr = `${appt.startTime || 'N/A'} - ${appt.endTime || ''}`;

            await sendApprovalEmail({
                patientEmail: appt.patientEmail || '',
                patientName: appt.patientName,
                doctorName: user?.name || 'Doctor',
                date: dateStr,
                time: timeStr
            });

            toast.success(`Appointment approved! Waiting for patient payment.`, { id: 'status' });
            fetchAppointments();
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve request', { id: 'status' });
        }
    };

    const handleRejectRequest = async (appointmentId: string) => {
        if (!user?.id) return;
        try {
            toast.loading('Rejecting request...', { id: 'status' });
            await doctorService.rejectAppointment(appointmentId);
            toast.success(`Appointment request rejected.`, { id: 'status' });
            fetchAppointments();
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject request', { id: 'status' });
        }
    };

    const canJoinCall = (appt: DoctorAppointment) => {
        if (appt.consultationType !== 'video') return false;
        if (!['scheduled', 'ongoing'].includes(appt.status)) return false;
        if (!appt.slotDate || !appt.startTime) return false;
        // Allow joining 10 minutes before
        const slotStart = new Date(`${appt.slotDate}T${appt.startTime}`);
        const now = new Date();
        const tenMinsBefore = new Date(slotStart.getTime() - 10 * 60 * 1000);
        return now >= tenMinsBefore;
    };

    const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-purple-600" /></div>;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
                <p className="text-slate-500 mt-1">Manage your consultations</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'pending_approval', label: 'Requests' },
                    { id: 'payment_pending', label: 'Awaiting Payment' },
                    { id: 'scheduled', label: 'Scheduled' },
                    { id: 'ongoing', label: 'Ongoing' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === f.id
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700">No appointments found</h3>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(appt => (
                        <Card key={appt.appointmentId} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{appt.patientName}</p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {appt.slotDate ? new Date(appt.slotDate).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {appt.startTime || 'N/A'} - {appt.endTime || ''}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {appt.consultationType === 'video' ? (
                                                        <><Video className="w-3 h-3 mr-1 text-blue-500" /> Video</>
                                                    ) : (
                                                        <><Building2 className="w-3 h-3 mr-1 text-amber-500" /> Hospital</>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <StatusBadge status={appt.status.toUpperCase() as any} size="sm" />

                                        {/* Action Buttons */}
                                        {appt.status === 'pending_approval' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => handleAcceptRequest(appt)}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                                    onClick={() => handleRejectRequest(appt.appointmentId)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                        {appt.status === 'scheduled' && (
                                            <>
                                                {appt.consultationType === 'video' && canJoinCall(appt) && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={async () => {
                                                            await handleStatusChange(appt.appointmentId, 'ongoing');
                                                            window.location.href = `/room/${appt.meetingRoomId}`;
                                                        }}
                                                    >
                                                        <PlayCircle className="w-4 h-4 mr-1" /> Start Call
                                                    </Button>
                                                )}
                                                {appt.consultationType === 'hospital' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleStatusChange(appt.appointmentId, 'ongoing')}
                                                    >
                                                        <PlayCircle className="w-4 h-4 mr-1" /> Start
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-rose-600 border-rose-200"
                                                    onClick={() => handleStatusChange(appt.appointmentId, 'cancelled')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Cancel
                                                </Button>
                                            </>
                                        )}
                                        {appt.status === 'ongoing' && (
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => handleStatusChange(appt.appointmentId, 'completed')}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                                            </Button>
                                        )}
                                        {appt.status === 'completed' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setNotesDialog({
                                                    open: true,
                                                    appointmentId: appt.appointmentId,
                                                    patientId: appt.patientId
                                                })}
                                            >
                                                <MessageSquare className="w-4 h-4 mr-1" /> Add Notes
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Notes Dialog */}
            <Dialog open={notesDialog.open} onOpenChange={(open) => setNotesDialog({ ...notesDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Consultation Notes</DialogTitle>
                        <DialogDescription>Add your medical advice and recommendations for the patient.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Enter your medical advice, prescriptions, follow-up instructions..."
                            rows={6}
                            className="resize-none"
                        />
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setNotesDialog({ open: false, appointmentId: '', patientId: '' })}>
                                Cancel
                            </Button>
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleAddNote} disabled={saving || !noteText.trim()}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                                Save Notes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useState, useEffect } from 'react';
import {
    Calendar, Clock, Video, Building2, User,
    Loader2, CreditCard, PlayCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { doctorService } from '@/services/doctorService';
import { sendConfirmationEmail } from '@/services/emailService';
import { toast } from 'sonner';
import type { DoctorAppointment } from '@/types';



export function PatientDoctorAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);

    const fetchAppointments = async () => {
        if (!user?.id) return;
        try {
            const data = await doctorService.getPatientAppointments(user.id);
            setAppointments(data);
        } catch (err) {
            console.error('Failed to load appointments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user?.id]);

    const handlePayment = async (appt: DoctorAppointment) => {
        if (!user?.id) return;
        setPaying(appt.appointmentId);
        try {
            // In a real app, this would open a payment gateway. Here we simulate success.
            await doctorService.processPayment({
                appointmentId: appt.appointmentId,
                patientId: user.id,
                doctorId: appt.doctorId,
                amount: 500, // Assuming a fixed amount for simplicity, or fetch from doctor
                consultationType: appt.consultationType
            });

            // Send confirmation email via EmailJS
            const dateStr = appt.slotDate ? new Date(appt.slotDate).toLocaleDateString() : 'N/A';
            const timeStr = `${appt.startTime || 'N/A'} - ${appt.endTime || ''}`;

            await sendConfirmationEmail({
                patientEmail: user.email || '',
                patientName: user.name || 'Patient',
                doctorName: appt.doctorName,
                date: dateStr,
                time: timeStr,
                consultationType: appt.consultationType,
                meetingRoomId: appt.meetingRoomId
            });

            toast.success('Payment successful! Appointment confirmed.');
            fetchAppointments();
        } catch (err: any) {
            toast.error(err.message || 'Payment failed');
        } finally {
            setPaying(null);
        }
    };

    const canJoinCall = (appt: DoctorAppointment) => {
        if (appt.consultationType !== 'video') return false;
        if (!['scheduled', 'ongoing'].includes(appt.status)) return false;
        if (!appt.slotDate || !appt.startTime) return false;

        const slotStart = new Date(`${appt.slotDate}T${appt.startTime}`);
        const now = new Date();
        const tenMinsBefore = new Date(slotStart.getTime() - 10 * 60 * 1000);
        return now >= tenMinsBefore;
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-teal-600" /></div>;

    return (
        <div className="space-y-6 text-slate-800 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Doctor Appointments</h1>
                <p className="text-slate-500 mt-1">Manage your consultations with doctors</p>
            </div>

            {appointments.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700">No doctor appointments found</h3>
                        <p className="text-slate-500 mt-1">You haven't requested any consultations yet.</p>
                        <Button className="mt-4 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.hash = 'doctors'}>
                            Browse Doctors
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/50 p-1">
                        <TabsTrigger
                            value="active"
                            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-slate-600"
                        >
                            Active <Badge variant="secondary" className="ml-2 bg-slate-200/50 text-slate-700">{appointments.filter(a => ['pending_approval', 'scheduled', 'ongoing'].includes(a.status)).length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="payment_pending"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-slate-600"
                        >
                            Payment <Badge variant="secondary" className="ml-2 bg-slate-200/50 text-slate-700">{appointments.filter(a => a.status === 'payment_pending').length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-slate-600"
                        >
                            History <Badge variant="secondary" className="ml-2 bg-slate-200/50 text-slate-700">{appointments.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status)).length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-0 outline-none">
                        <AppointmentList
                            appointments={appointments.filter(a => ['pending_approval', 'scheduled', 'ongoing'].includes(a.status))}
                            handlePayment={handlePayment}
                            paying={paying}
                            canJoinCall={canJoinCall}
                            emptyMessage="No active appointments or requests."
                        />
                    </TabsContent>

                    <TabsContent value="payment_pending" className="mt-0 outline-none">
                        <AppointmentList
                            appointments={appointments.filter(a => a.status === 'payment_pending')}
                            handlePayment={handlePayment}
                            paying={paying}
                            canJoinCall={canJoinCall}
                            emptyMessage="No appointments awaiting payment."
                        />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0 outline-none">
                        <AppointmentList
                            appointments={appointments.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status))}
                            handlePayment={handlePayment}
                            paying={paying}
                            canJoinCall={canJoinCall}
                            emptyMessage="No past appointments."
                        />
                    </TabsContent>

                </Tabs>
            )}
        </div>
    );
}

function AppointmentList({ appointments, handlePayment, paying, canJoinCall, emptyMessage }: any) {
    if (appointments.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {appointments.map((appt: any) => (
                <Card key={appt.appointmentId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-lg">Dr. {appt.doctorName}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{appt.doctorSpecialization}</p>

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {appt.slotDate ? new Date(appt.slotDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-slate-400" />
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

                            <div className="flex flex-col items-start md:items-end gap-3 min-w-[140px]">
                                <StatusBadge status={appt.status.toUpperCase() as any} size="sm" />

                                {/* Action Buttons based on status */}
                                {appt.status === 'payment_pending' && (
                                    <Button
                                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 shadow-sm"
                                        onClick={() => handlePayment(appt)}
                                        disabled={paying === appt.appointmentId}
                                    >
                                        {paying === appt.appointmentId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                                        Pay Now
                                    </Button>
                                )}

                                {appt.status === 'scheduled' && appt.consultationType === 'video' && canJoinCall(appt) && (
                                    <Button
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-sm"
                                        onClick={() => window.location.href = `/room/${appt.meetingRoomId}`}
                                    >
                                        <PlayCircle className="w-4 h-4 mr-2" />
                                        Join Video Call
                                    </Button>
                                )}

                                {appt.status === 'scheduled' && appt.consultationType === 'video' && !canJoinCall(appt) && (
                                    <p className="text-xs text-slate-500 text-center md:text-right">Call link will be active<br />10 mins before slot</p>
                                )}

                                {appt.status === 'pending_approval' && (
                                    <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                        <AlertCircle className="w-3 h-3 mr-1" /> Awaiting Doctor Approval
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

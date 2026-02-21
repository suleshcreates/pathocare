import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Building2, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { doctorService } from '@/services/doctorService';
import type { DoctorAppointment } from '@/types';

export function DoctorDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        (async () => {
            try {
                const data = await doctorService.getDoctorAppointments(user.id);
                setAppointments(data);
            } catch (err) {
                console.error('Failed to load appointments', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id]);

    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.slotDate === today);
    const upcoming = appointments.filter(a => a.status === 'scheduled');
    const completed = appointments.filter(a => a.status === 'completed');

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-purple-600" /></div>;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Doctor Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back, Dr. {user?.name}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-purple-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{todayAppts.length}</p>
                            <p className="text-sm text-slate-500">Today's Appointments</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{upcoming.length}</p>
                            <p className="text-sm text-slate-500">Upcoming</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{completed.length}</p>
                            <p className="text-sm text-slate-500">Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-indigo-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
                            <p className="text-sm text-slate-500">Total Patients</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Appointments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Upcoming Appointments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcoming.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No upcoming appointments</div>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.slice(0, 5).map(appt => (
                                <div key={appt.appointmentId} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{appt.patientName}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {appt.slotDate ? new Date(appt.slotDate).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {appt.startTime || 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {appt.consultationType === 'video' ? <Video className="w-3 h-3 text-blue-500" /> : <Building2 className="w-3 h-3 text-amber-500" />}
                                                    {appt.consultationType === 'video' ? 'Video' : 'Hospital'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={appt.status.toUpperCase() as any} size="sm" />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

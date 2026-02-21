import { useState, useEffect } from 'react';
import {
    Search, Star, Video, Building2, Calendar, Clock,
    Loader2, ChevronRight, CreditCard, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { doctorService } from '@/services/doctorService';
import { toast } from 'sonner';
import type { DoctorProfile, DoctorSlot, ConsultationType } from '@/types';

export function BrowseDoctors() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Booking State
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
    const [bookingStep, setBookingStep] = useState<'info' | 'select' | 'slots' | 'pay' | 'success'>('info');
    const [consultationType, setConsultationType] = useState<ConsultationType>('video');
    const [availableSlots, setAvailableSlots] = useState<DoctorSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await doctorService.getDoctors();
                setDoctors(data);
            } catch (err) {
                console.error('Failed to load doctors', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = doctors.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.specialization || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectDoctor = (doctor: DoctorProfile) => {
        setSelectedDoctor(doctor);
        setBookingStep('info');
        setSelectedSlot(null);
    };

    const handleSelectType = async (type: ConsultationType) => {
        if (!selectedDoctor) return;
        setConsultationType(type);
        setSlotsLoading(true);
        try {
            const slots = await doctorService.getAvailableSlots(selectedDoctor.id, type);
            setAvailableSlots(slots);
            setBookingStep('slots');
        } catch (err) {
            toast.error('Failed to load available slots');
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleRequest = async () => {
        if (!user?.id || !selectedDoctor || !selectedSlot) return;
        setBooking(true);
        try {
            await doctorService.requestAppointment({
                patientId: user.id,
                doctorId: selectedDoctor.id,
                slotId: selectedSlot.slotId,
                consultationType
            });
            setBookingStep('success');
            toast.success('Appointment request sent to doctor!');
        } catch (err: any) {
            toast.error(err.message || 'Request failed');
        } finally {
            setBooking(false);
        }
    };

    const resetBooking = () => {
        setSelectedDoctor(null);
        setBookingStep('info');
        setSelectedSlot(null);
        setAvailableSlots([]);
    };

    // Group slots by date
    const groupedSlots: Record<string, DoctorSlot[]> = {};
    availableSlots.forEach(s => {
        if (!groupedSlots[s.slotDate]) groupedSlots[s.slotDate] = [];
        groupedSlots[s.slotDate].push(s);
    });

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-teal-600" /></div>;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Consult a Doctor</h1>
                <p className="text-slate-500 mt-1">Book a video or hospital consultation with our verified doctors</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search by name or specialization..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Doctor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(doctor => (
                    <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleSelectDoctor(doctor)}>
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                {doctor.profileImg ? (
                                    <img src={doctor.profileImg} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100" />
                                ) : (
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                                        {doctor.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-800 group-hover:text-purple-600 transition-colors truncate">{doctor.name}</h3>
                                    <p className="text-sm text-purple-600 font-medium truncate">{doctor.specialization || 'General'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {doctor.workingHospital || 'Independent'}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span className="text-xs text-slate-500">4.8 (120 reviews)</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors shrink-0" />
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-lg font-bold text-slate-800">₹{doctor.consultationFee || 500}</span>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs"><Video className="w-3 h-3 mr-1 text-blue-500" />Video</Badge>
                                    <Badge variant="outline" className="text-xs"><Building2 className="w-3 h-3 mr-1 text-amber-500" />Hospital</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700">No doctors found</h3>
                    <p className="text-slate-500 mt-1">Try a different search query</p>
                </div>
            )}

            {/* Booking Dialog */}
            <Dialog open={!!selectedDoctor} onOpenChange={(open) => { if (!open) resetBooking(); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {bookingStep === 'success' ? 'Booking Confirmed!' : `Book with ${selectedDoctor?.name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {bookingStep === 'info' && 'Doctor Details'}
                            {bookingStep === 'select' && 'Choose your consultation type'}
                            {bookingStep === 'slots' && 'Select an available time slot'}
                            {bookingStep === 'pay' && 'Confirm your appointment request'}
                            {bookingStep === 'success' && 'Your appointment request has been sent!'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {/* Step 0: Doctor Info */}
                        {bookingStep === 'info' && selectedDoctor && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    {selectedDoctor.profileImg ? (
                                        <img src={selectedDoctor.profileImg} alt={selectedDoctor.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-100" />
                                    ) : (
                                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                            {selectedDoctor.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800">{selectedDoctor.name}</h3>
                                        <p className="text-purple-600 font-medium">{selectedDoctor.specialization}</p>
                                        <p className="text-sm text-slate-500 mt-1">{selectedDoctor.qualification}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Experience</p>
                                        <p className="font-medium text-slate-800">{selectedDoctor.experienceYears} Years</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Hospital/Clinic</p>
                                        <p className="font-medium text-slate-800">{selectedDoctor.workingHospital || 'Independent'}</p>
                                    </div>
                                </div>

                                {selectedDoctor.bio && (
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-2">About {selectedDoctor.name}</p>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {selectedDoctor.bio}
                                        </p>
                                    </div>
                                )}

                                <Button className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg font-semibold rounded-xl" onClick={() => setBookingStep('select')}>
                                    Book Consultation
                                </Button>
                            </div>
                        )}

                        {/* Step 1: Select Type */}
                        {bookingStep === 'select' && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSelectType('video')}
                                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Video className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-slate-800">Video Consultation</p>
                                        <p className="text-sm text-slate-500">Connect via secure video call from home</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => handleSelectType('hospital')}
                                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
                                >
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-slate-800">Hospital Visit</p>
                                        <p className="text-sm text-slate-500">Visit the doctor at their clinic</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                                {slotsLoading && (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="animate-spin w-6 h-6 text-purple-600" />
                                    </div>
                                )}
                                <Button variant="outline" className="w-full mt-2" onClick={() => setBookingStep('info')}>
                                    ← Back to Profile
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Select Slot */}
                        {bookingStep === 'slots' && (
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {Object.keys(groupedSlots).length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        No available slots for {consultationType} consultation
                                    </div>
                                ) : (
                                    Object.entries(groupedSlots).map(([date, dateSlots]) => (
                                        <div key={date}>
                                            <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {dateSlots.map(slot => (
                                                    <button
                                                        key={slot.slotId}
                                                        onClick={() => { setSelectedSlot(slot); setBookingStep('pay'); }}
                                                        className="flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-sm font-medium transition-all hover:border-purple-400 hover:bg-purple-50 border-slate-200"
                                                    >
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        {slot.startTime} - {slot.endTime}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <Button variant="outline" className="w-full" onClick={() => setBookingStep('select')}>
                                    ← Back
                                </Button>
                            </div>
                        )}

                        {/* Step 3: Confirm Request */}
                        {bookingStep === 'pay' && selectedSlot && selectedDoctor && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    <h4 className="font-semibold text-slate-800 border-b pb-2 mb-2">Request Summary</h4>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Doctor</span>
                                        <span className="font-medium text-slate-800">{selectedDoctor.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Type</span>
                                        <Badge variant="outline" className="text-xs">
                                            {consultationType === 'video' ? <><Video className="w-3 h-3 mr-1" /> Video</> : <><Building2 className="w-3 h-3 mr-1" /> Hospital</>}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-medium text-slate-800">
                                            {new Date(selectedSlot.slotDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Time</span>
                                        <span className="font-medium text-slate-800">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between">
                                        <span className="font-semibold text-slate-800">Consultation Fee</span>
                                        <span className="text-xl font-bold text-purple-600">₹{selectedDoctor.consultationFee || 500}</span>
                                    </div>
                                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-3">
                                        Payment is required only after the doctor approves your request.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setBookingStep('slots')}>← Back</Button>
                                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleRequest} disabled={booking}>
                                        {booking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        Request Appointment
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Success */}
                        {bookingStep === 'success' && (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Request Sent Successfully!</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    Your request has been sent to Dr. {selectedDoctor?.name}. You will receive an email once the doctor approves the appointment, after which you can complete the payment.
                                </p>
                                <div className="pt-4">
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={resetBooking}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

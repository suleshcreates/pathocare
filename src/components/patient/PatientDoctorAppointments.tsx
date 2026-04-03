import { useState, useEffect, useRef } from 'react';
import {
    Calendar, Clock, Building2, User,
    Loader2, CreditCard, AlertCircle, Download, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { doctorService } from '@/services/doctorService';
import { paymentService } from '@/services/paymentService';
import { sendConfirmationEmail } from '@/services/emailService';
import { toast } from 'sonner';
import type { DoctorAppointment } from '@/types';



export function PatientDoctorAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

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
            // 1. Create Razorpay order via backend
            const { order, key } = await paymentService.createOrder({
                amount: 500,
                bookingId: appt.appointmentId,
                type: 'doctor'
            });

            // 2. Open Razorpay checkout modal
            const paymentResult = await paymentService.openCheckout({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key,
                bookingId: appt.appointmentId,
                type: 'doctor',
                patientName: user.name || 'Patient',
                patientEmail: user.email || '',
                description: `Doctor Consultation - ${appt.doctorName || 'Doctor'}`
            });

            // 3. Verify payment on backend
            await paymentService.verifyPayment({
                ...paymentResult,
                bookingId: appt.appointmentId,
                type: 'doctor',
                amount: 500
            });

            // 4. Send confirmation email
            const dateStr = appt.slotDate ? new Date(appt.slotDate).toLocaleDateString() : 'N/A';
            const timeStr = `${appt.startTime || 'N/A'} - ${appt.endTime || ''}`;

            await sendConfirmationEmail({
                patientEmail: user.email || '',
                patientName: user.name || 'Patient',
                doctorName: appt.doctorName || 'Doctor',
                date: dateStr,
                time: timeStr,
                consultationType: appt.consultationType,
                meetingRoomId: appt.meetingRoomId
            });

            toast.success('Payment successful! Appointment confirmed.');
            fetchAppointments();
            
            // Show receipt dialog
            setReceiptData({
                id: paymentResult.razorpay_payment_id || 'PAY_' + Date.now().toString().slice(-6),
                orderId: order.id,
                amount: 500,
                date: new Date().toLocaleString(),
                doctorName: appt.doctorName,
                consultationType: appt.consultationType || 'Virtual Consultation',
                status: 'Paid'
            });
            
        } catch (err: any) {
            if (err.message === 'Payment cancelled by user') {
                toast.info('Payment cancelled');
            } else {
                toast.error(err.message || 'Payment failed');
            }
        } finally {
            setPaying(null);
        }
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
                            emptyMessage="No active appointments or requests."
                        />
                    </TabsContent>

                    <TabsContent value="payment_pending" className="mt-0 outline-none">
                        <AppointmentList
                            appointments={appointments.filter(a => a.status === 'payment_pending')}
                            handlePayment={handlePayment}
                            paying={paying}
                            emptyMessage="No appointments awaiting payment."
                        />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0 outline-none">
                        <AppointmentList
                            appointments={appointments.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status))}
                            handlePayment={handlePayment}
                            paying={paying}
                            emptyMessage="No past appointments."
                        />
                    </TabsContent>

                </Tabs>
            )}

            {/* Payment Receipt Dialog */}
            <Dialog open={!!receiptData} onOpenChange={() => setReceiptData(null)}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">Payment Successful</DialogTitle>
                        <DialogDescription className="text-center">
                            Your payment has been processed successfully.
                        </DialogDescription>
                    </DialogHeader>

                    {receiptData && (
                        <div className="mt-4" ref={receiptRef}>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                    <span className="text-slate-500">Amount Paid</span>
                                    <span className="text-2xl font-bold text-slate-800">₹{receiptData.amount}</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Transaction ID</span>
                                        <span className="font-medium text-slate-700">{receiptData.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Order ID</span>
                                        <span className="font-medium text-slate-700">{receiptData.orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Date & Time</span>
                                        <span className="font-medium text-slate-700">{receiptData.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Doctor</span>
                                        <span className="font-medium text-slate-700">Dr. {receiptData.doctorName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Consultation</span>
                                        <span className="font-medium text-slate-700">{receiptData.consultationType}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        const printContent = document.createElement('div');
                                        printContent.innerHTML = `
                                            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                                                <h2 style="text-align: center; color: #0d9488;">PathoCare Receipt</h2>
                                                <hr style="border-top: 1px dashed #ccc; margin: 20px 0;" />
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <span>Amount</span><strong>Rs. ${receiptData.amount}</strong>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <span>Transaction ID</span><span>${receiptData.id}</span>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <span>Order ID</span><span>${receiptData.orderId}</span>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <span>Date</span><span>${receiptData.date}</span>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <span>Doctor</span><span>Dr. ${receiptData.doctorName}</span>
                                                </div>
                                                <hr style="border-top: 1px dashed #ccc; margin: 20px 0;" />
                                                <p style="text-align: center; font-size: 12px; color: #666;">Thank you for choosing PathoCare</p>
                                            </div>
                                        `;
                                        const win = window.open('', '_blank');
                                        if (win) {
                                            win.document.write(printContent.innerHTML);
                                            win.document.close();
                                            win.print();
                                        }
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Receipt
                                </Button>
                                <Button
                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={() => setReceiptData(null)}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AppointmentList({ appointments, handlePayment, paying, emptyMessage }: any) {
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
                                            <Building2 className="w-3 h-3 mr-1 text-amber-500" /> Hospital Visit
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

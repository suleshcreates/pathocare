import {
    Calendar, Clock, MapPin, CreditCard, Building2, Home,
    FlaskConical, CheckCircle2, User, IndianRupee, X, FileText
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/StatusBadge';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';

interface BookingDetailsDialogProps {
    booking: Booking | null;
    open: boolean;
    onClose: () => void;
}

// Status timeline steps
const STATUS_STEPS = [
    { key: 'REQUESTED', label: 'Requested', icon: FileText },
    { key: 'PAYMENT_PENDING', label: 'Payment Pending', icon: CreditCard },
    { key: 'BOOKED', label: 'Booked', icon: CheckCircle2 },
    { key: 'TECH_ASSIGNED', label: 'Technician Assigned', icon: User },
    { key: 'SAMPLE_COLLECTED', label: 'Sample Collected', icon: FlaskConical },
    { key: 'TESTING', label: 'Testing', icon: FlaskConical },
    { key: 'REPORT_READY', label: 'Report Ready', icon: FileText },
];

function getStepIndex(status: string): number {
    const upper = status?.toUpperCase();
    if (upper === 'REJECTED') return -1;
    return STATUS_STEPS.findIndex(s => s.key === upper);
}

export function BookingDetailsDialog({ booking, open, onClose }: BookingDetailsDialogProps) {
    if (!booking) return null;

    const currentStepIdx = getStepIndex(booking.status);
    const isRejected = booking.status?.toUpperCase() === 'REJECTED';
    const b = booking as any;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FlaskConical className="w-5 h-5 text-teal-600" />
                        Booking Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Test & Lab Info */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-lg text-slate-800">{booking.testName}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {booking.labName}
                                </p>
                            </div>
                            <StatusBadge status={booking.status} />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Date</p>
                                    <p className="font-medium text-slate-700">
                                        {booking.appointmentDate
                                            ? new Date(booking.appointmentDate).toLocaleDateString('en-IN', {
                                                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                            })
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Time</p>
                                    <p className="font-medium text-slate-700">{booking.appointmentTime || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {b.collectionType === 'home'
                                    ? <Home className="w-4 h-4 text-slate-400" />
                                    : <Building2 className="w-4 h-4 text-slate-400" />}
                                <div>
                                    <p className="text-slate-500 text-xs">Collection Type</p>
                                    <p className="font-medium text-slate-700 capitalize">{b.collectionType || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Booked On</p>
                                    <p className="font-medium text-slate-700">
                                        {booking.bookedAt
                                            ? new Date(booking.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 space-y-3 border border-emerald-100">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            Payment Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs">Test Price</p>
                                <p className="font-bold text-lg text-emerald-700 flex items-center">
                                    <IndianRupee className="w-4 h-4" />
                                    {b.price ? b.price.toFixed(2) : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">Payment Status</p>
                                {(booking as any).paymentStatus === 'paid' ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 mt-1">
                                        ✅ Paid
                                    </Badge>
                                ) : booking.status === 'PAYMENT_PENDING' ? (
                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0 mt-1">
                                        ⏳ Awaiting Payment
                                    </Badge>
                                ) : (
                                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 mt-1">
                                        Not Required Yet
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {(booking as any).razorpayPaymentId && (
                            <div className="text-xs text-slate-500 bg-white/50 rounded-lg p-2 mt-2">
                                <span className="font-medium">Transaction ID:</span>{' '}
                                <span className="font-mono">{(booking as any).razorpayPaymentId}</span>
                            </div>
                        )}
                    </div>

                    {/* Technician Info (if assigned) */}
                    {booking.technicianName && (
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-indigo-600" />
                                Technician Details
                            </h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{booking.technicianName}</p>
                                    <p className="text-sm text-slate-500">{booking.technicianPhone || 'No contact'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Timeline */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-4">Booking Timeline</h4>
                        {isRejected ? (
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <X className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-red-700">Booking Rejected</p>
                                    <p className="text-xs text-red-500">This booking was rejected by the lab.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                {STATUS_STEPS.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIdx;
                                    const isCurrent = idx === currentStepIdx;
                                    const StepIcon = step.icon;

                                    return (
                                        <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                                            {/* Connector line */}
                                            <div className="flex flex-col items-center">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                                                    isCompleted
                                                        ? 'bg-teal-500 border-teal-500 text-white'
                                                        : 'bg-white border-slate-200 text-slate-400'
                                                )}>
                                                    <StepIcon className="w-4 h-4" />
                                                </div>
                                                {idx < STATUS_STEPS.length - 1 && (
                                                    <div className={cn(
                                                        'w-0.5 h-6 mt-1',
                                                        idx < currentStepIdx ? 'bg-teal-500' : 'bg-slate-200'
                                                    )} />
                                                )}
                                            </div>
                                            {/* Label */}
                                            <div className="pt-1">
                                                <p className={cn(
                                                    'text-sm font-medium',
                                                    isCompleted ? 'text-slate-800' : 'text-slate-400'
                                                )}>
                                                    {step.label}
                                                    {isCurrent && (
                                                        <span className="ml-2 text-xs text-teal-600 animate-pulse">● Current</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Report Download */}
                    {b.reportUrl && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-blue-800">Report Available</h4>
                                <p className="text-sm text-blue-600">Your test report is ready for download</p>
                            </div>
                            <a
                                href={b.reportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Download
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

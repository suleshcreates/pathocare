import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Beaker, CheckCircle2, User, FlaskConical, FileText,
  AlertCircle, Scan, QrCode, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { bookings } from '@/data/mockData';
import type { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const workflowSteps = [
  {
    id: 'booked',
    label: 'Booked',
    description: 'Appointment scheduled',
    icon: CheckCircle2
  },
  {
    id: 'technician-assigned',
    label: 'Technician Assigned',
    description: 'Staff allocated',
    icon: User
  },
  {
    id: 'sample-collected',
    label: 'Sample Collected',
    description: 'Sample received at lab',
    icon: Beaker
  },
  {
    id: 'testing',
    label: 'Testing',
    description: 'Analysis in progress',
    icon: FlaskConical
  },
  {
    id: 'report-ready',
    label: 'Report Ready',
    description: 'Results available',
    icon: FileText
  },
];

export function SampleWorkflow() {
  const [scanningId, setScanningId] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<typeof bookings[0] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  const activeBookings = bookings.filter(b =>
    b.status !== 'REPORT_READY' && b.status !== 'REJECTED'
  );

  const handleScan = () => {
    const booking = bookings.find(b => b.id === scanningId || b.qrCode === scanningId);
    if (booking) {
      setSelectedBooking(booking);
    }
  };

  const getCurrentStepIndex = (status: BookingStatus) => {
    return workflowSteps.findIndex(step => step.id === status);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sample Workflow</h1>
        <p className="text-slate-500 mt-1">Track and manage sample processing workflow</p>
      </div>

      {/* Scanner Section */}
      <Card className="animate-item bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <Scan className="w-10 h-10" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold">Quick Sample Scan</h3>
              <p className="text-indigo-100 mt-1">Enter booking ID or scan QR code to track sample</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Input
                placeholder="Enter ID or scan QR"
                value={scanningId}
                onChange={(e) => setScanningId(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 w-full md:w-64"
              />
              <Button
                onClick={handleScan}
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Booking Workflow */}
      {selectedBooking && (
        <Card className="animate-item">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Workflow Progress</span>
              <Badge className="bg-indigo-100 text-indigo-700">
                {selectedBooking.testName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-slate-200 rounded-full" />
              <div
                className="absolute top-8 left-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(getCurrentStepIndex(selectedBooking.status) / (workflowSteps.length - 1)) * 100}%`
                }}
              />

              {/* Steps */}
              <div className="relative flex justify-between">
                {workflowSteps.map((step, index) => {
                  const currentIndex = getCurrentStepIndex(selectedBooking.status);
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10',
                        isCompleted
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-white border-slate-300 text-slate-400',
                        isCurrent && 'ring-4 ring-indigo-500/30 scale-110'
                      )}>
                        <Icon className={cn('w-7 h-7', isCurrent && 'animate-pulse')} />
                      </div>
                      <div className="mt-3 text-center">
                        <p className={cn(
                          'font-medium text-sm',
                          isCompleted ? 'text-slate-800' : 'text-slate-400'
                        )}>
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Details */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-slate-800">Current Status</p>
                  <p className="text-sm text-slate-500">
                    Sample is currently in &quot;{workflowSteps[getCurrentStepIndex(selectedBooking.status)]?.label}&quot; stage
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Samples */}
      <div className="animate-item">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Samples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeBookings.map((booking) => {
            const currentStep = getCurrentStepIndex(booking.status);
            const progress = ((currentStep + 1) / workflowSteps.length) * 100;

            return (
              <Card
                key={booking.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg',
                  selectedBooking?.id === booking.id && 'ring-2 ring-indigo-500'
                )}
                onClick={() => setSelectedBooking(booking)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-slate-800">{booking.testName}</h4>
                      <p className="text-sm text-slate-500">{booking.patientName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {booking.id}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {booking.appointmentDate} at {booking.appointmentTime}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

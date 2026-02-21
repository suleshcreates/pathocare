import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  FlaskConical, Calendar, FileText, Clock,
  TrendingUp, Activity, Heart, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { bookingService } from '@/services/bookingService';
import { doctorService } from '@/services/doctorService';
import type { Booking, DoctorAppointment } from '@/types';

export function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctorAppointments, setDoctorAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Animation
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }

    // Fetch Data
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        const [labData, doctorData] = await Promise.all([
          bookingService.getPatientBookings(user.id),
          doctorService.getPatientAppointments(user.id)
        ]);
        setBookings(labData || []);
        setDoctorAppointments(doctorData || []);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id]);

  const upcomingBooking = bookings.find(b =>
    b.status !== 'REPORT_READY'
  );

  // Real stats calculation
  const completedTests = bookings.filter(b => b.status === 'REPORT_READY').length;
  const pendingTests = bookings.filter(b =>
    b.status !== 'REPORT_READY'
  ).length;

  // Placeholder logic for reports/health score until we have reportService
  const recentReports = bookings.filter(b => b.reportUrl).slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your dashboard...</div>;


  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="animate-item bg-gradient-to-br from-teal-500 via-teal-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-teal-100 text-xs sm:text-sm font-medium">{getGreeting()}</p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5 sm:mt-1">{user?.name || 'Patient'}</h1>
              <p className="text-teal-100 mt-1 sm:mt-2 max-w-md text-sm sm:text-base hidden sm:block">
                Welcome back to your health dashboard. Here&apos;s what&apos;s happening with your health journey.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm text-xs sm:text-sm"
                onClick={() => navigate('/dashboard#tests')}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Book Test
              </Button>
              <Button
                size="sm"
                className="bg-white text-teal-600 hover:bg-teal-50 text-xs sm:text-sm"
                onClick={() => navigate('/dashboard#reports')}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Pending Alert */}
      {doctorAppointments.some(a => a.status === 'payment_pending') && (
        <div className="animate-item bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Action Required: Pending Payment</h3>
              <p className="text-sm text-amber-700 mt-0.5">You have one or more doctor appointment requests approved. Please complete the payment to secure your slot.</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/dashboard#doctor-appointments')}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            Pay Now
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="animate-item">
          <StatCard
            title="Total Tests"
            value={bookings.length}
            subtitle="All time bookings"
            icon={FlaskConical}
            color="teal"
            trend={{ value: 12, isPositive: true }}
          />
        </div>
        <div className="animate-item">
          <StatCard
            title="Completed"
            value={completedTests}
            subtitle="Successfully completed"
            icon={Activity}
            color="emerald"
          />
        </div>
        <div className="animate-item">
          <StatCard
            title="Pending"
            value={pendingTests}
            subtitle="In progress"
            icon={Clock}
            color="amber"
          />
        </div>
        <div className="animate-item">
          <StatCard
            title="Health Score"
            value="92"
            subtitle="Based on recent tests"
            icon={Heart}
            color="rose"
            trend={{ value: 5, isPositive: true }}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Appointment */}
        <div className="animate-item lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Appointment</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Your next scheduled test</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-600" onClick={() => navigate('/dashboard#appointments')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingBooking ? (
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <FlaskConical className="w-5 h-5 sm:w-7 sm:h-7 text-teal-600" />
                      </div>
                      <div>
                        {/* @ts-ignore: Supabase join returns nested object */}
                        <h3 className="font-semibold text-slate-800">{upcomingBooking.test?.name || upcomingBooking.testName}</h3>
                        {/* @ts-ignore: Supabase join returns nested object */}
                        <p className="text-sm text-slate-500">{upcomingBooking.lab?.name || upcomingBooking.labName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {upcomingBooking.appointmentDate}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {upcomingBooking.appointmentTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <StatusBadge status={upcomingBooking.status} />
                      {upcomingBooking.technicianName && (
                        <p className="text-xs text-slate-500">
                          Technician: {upcomingBooking.technicianName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between gap-1">
                      {['Booked', 'Assigned', 'Collected', 'Testing', 'Ready'].map((step, idx) => {
                        const statusOrder = ['booked', 'technician-assigned', 'sample-collected', 'testing', 'report-ready'];
                        const currentIdx = statusOrder.indexOf(upcomingBooking.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="flex flex-col items-center gap-2">
                            <div className={cn(
                              'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all',
                              isCompleted
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-200 text-slate-400',
                              isCurrent && 'ring-2 sm:ring-4 ring-teal-500/20 scale-110'
                            )}>
                              {idx + 1}
                            </div>
                            <span className={cn(
                              'text-[10px] sm:text-xs',
                              isCompleted ? 'text-slate-700' : 'text-slate-400'
                            )}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-slate-700 font-medium">No upcoming appointments</h3>
                  <p className="text-sm text-slate-500 mt-1">Book a test to get started</p>
                  <Button
                    className="mt-4 bg-teal-500 hover:bg-teal-600"
                    onClick={() => navigate('/dashboard#tests')}
                  >
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Book a Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div className="animate-item">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Latest test results</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="group p-4 bg-slate-50 rounded-xl hover:bg-teal-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/dashboard#reports')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          {/* @ts-ignore: handling nested data */}
                          <h4 className="font-medium text-slate-800 text-sm">{report.test?.name || report.testName}</h4>
                          {/* @ts-ignore: handling nested data */}
                          <p className="text-xs text-slate-500">{report.lab?.name || report.labName}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-slate-500">
                        {new Date(report.completedAt || report.bookedAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        Ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
                onClick={() => navigate('/dashboard#reports')}
              >
                <FileText className="w-4 h-4 mr-2" />
                View All Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-item">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { icon: FlaskConical, label: 'Book Test', color: 'bg-teal-100 text-teal-600' },
            { icon: Calendar, label: 'Doctor Appts', color: 'bg-indigo-100 text-indigo-600' },
            { icon: FileText, label: 'Reports', color: 'bg-emerald-100 text-emerald-600' },
            { icon: TrendingUp, label: 'Track', color: 'bg-amber-100 text-amber-600' },
          ].map((action) => (
            <button
              key={action.label}
              className="group p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all"
              onClick={() => {
                if (action.label === 'Book Test') navigate('/dashboard#tests');
                if (action.label === 'Reports') navigate('/dashboard#reports');
                if (action.label === 'Track') navigate('/dashboard#history');
                if (action.label === 'Doctor Appts') navigate('/dashboard#doctor-appointments');
              }}
            >
              <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110', action.color)}>
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="font-medium text-slate-700 text-xs sm:text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

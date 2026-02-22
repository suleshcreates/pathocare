import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Calendar, Clock, User, Phone, ChevronRight,
  Download, Eye, Search, Home, Building2, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/StatusBadge';
import { BookingDetailsDialog } from './BookingDetailsDialog';
import { bookingService } from '@/services/bookingService'; // Use service
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/context/AuthContext'; // Use auth
import type { Booking, BookingStatus } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusFilters: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'BOOKED' },
  { label: 'In Progress', value: 'TESTING' },
  { label: 'Ready', value: 'REPORT_READY' },
];

export function Appointments() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Razorpay payment handler for lab bookings
  const handleLabPayment = async (booking: Booking) => {
    if (!user?.id) return;
    setPayingId(booking.id);
    try {
      const price = (booking as any).price || 500;

      // 1. Create order
      const { order, key } = await paymentService.createOrder({
        amount: price,
        bookingId: booking.id,
        type: 'lab'
      });

      // 2. Open Razorpay checkout
      const paymentResult = await paymentService.openCheckout({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key,
        bookingId: booking.id,
        type: 'lab',
        patientName: user.name || 'Patient',
        patientEmail: user.email || '',
        description: `Lab Test - ${booking.testName}`
      });

      // 3. Verify payment
      await paymentService.verifyPayment({
        ...paymentResult,
        bookingId: booking.id,
        type: 'lab',
        amount: price
      });

      toast.success('Payment successful! Booking confirmed.');
      // Refresh bookings
      const data = await bookingService.getPatientBookings(user.id);
      setBookings(data as Booking[]);
    } catch (err: any) {
      if (err.message === 'Payment cancelled by user') {
        toast.info('Payment cancelled');
      } else {
        toast.error(err.message || 'Payment failed');
      }
    } finally {
      setPayingId(null);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await bookingService.getPatientBookings(user.id);
        setBookings(data as Booking[]);
      } catch (error) {
        console.error("Failed to fetch appointments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user?.id]);

  useEffect(() => {
    if (containerRef.current && !loading) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.appointment-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [statusFilter, searchQuery, loading]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.labName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Active: Not Ready yet (Booked, Assigned, Collected, Testing)
  const activeBookings = filteredBookings.filter(b =>
    b.status !== 'REPORT_READY'
  );

  // Past: Report Ready (Completed)
  const pastBookings = filteredBookings.filter(b =>
    b.status === 'REPORT_READY'
  );

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5">Track and manage your test appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl whitespace-nowrap text-xs sm:text-sm font-medium transition-all',
              statusFilter === filter.value
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">
            Active ({activeBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <Card
                key={booking.id}
                className="appointment-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="p-3 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                      {/* Test Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{booking.testName}</h3>
                          <p className="text-sm text-slate-500">{booking.labName}</p>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {booking.appointmentDate}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {booking.appointmentTime}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {booking.collectionType === 'home' ? (
                                <><Home className="w-3 h-3 mr-1" /> Home</>
                              ) : (
                                <><Building2 className="w-3 h-3 mr-1" /> Lab</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3">
                        <StatusBadge status={booking.status} />
                        {booking.status === 'PAYMENT_PENDING' && (
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={payingId === booking.id}
                            onClick={() => handleLabPayment(booking)}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            {payingId === booking.id ? 'Processing...' : 'Pay Now'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setDetailsBooking(booking)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedBooking === booking.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {booking.technicianName && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                            <h4 className="font-medium text-slate-800 mb-2">Technician Details</h4>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{booking.technicianName}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {booking.technicianPhone}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse */}
                  <button
                    onClick={() => setSelectedBooking(
                      selectedBooking === booking.id ? null : booking.id
                    )}
                    className="w-full py-2 bg-slate-50 text-slate-500 text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                  >
                    {selectedBooking === booking.id ? 'Show Less' : 'Show More'}
                    <ChevronRight className={cn(
                      'w-4 h-4 transition-transform',
                      selectedBooking === booking.id && 'rotate-90'
                    )} />
                  </button>
                </CardContent>
              </Card>
            ))}

            {activeBookings.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700">No active appointments</h3>
                <p className="text-slate-500 mt-1">Book a test to get started</p>
                <Button className="mt-4 bg-teal-500 hover:bg-teal-600">
                  Book a Test
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <Card
                key={booking.id}
                className="appointment-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-3 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{booking.testName}</h3>
                        <p className="text-sm text-slate-500">{booking.labName}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-slate-500">
                            Completed on {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={booking.status} size="sm" />
                      <Button variant="outline" size="sm" onClick={() => setDetailsBooking(booking)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      {booking.reportUrl && (
                        <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                          <Download className="w-4 h-4 mr-1" />
                          Report
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pastBookings.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700">No past appointments</h3>
                <p className="text-slate-500 mt-1">Your completed tests will appear here</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BookingDetailsDialog
        booking={detailsBooking}
        open={!!detailsBooking}
        onClose={() => setDetailsBooking(null)}
      />
    </div>
  );
}

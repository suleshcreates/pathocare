import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Calendar, Search, User, Building2,
  ChevronLeft, ChevronRight, Eye, Download, MoreHorizontal,
  CheckCircle2, Clock, Beaker, FileText, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { adminService } from '@/services/adminService';
import type { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

export function BookingOversight() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await adminService.getBookings();
        setBookings(data || []);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.booking-row'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
      );
    }
  }, [searchQuery, statusFilter]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.labName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'REPORT_READY').length,
    pending: bookings.filter(b => b.status === 'BOOKED').length,
    inProgress: bookings.filter(b => b.status === 'TESTING' || b.status === 'SAMPLE_COLLECTED').length,
    reportReady: bookings.filter(b => b.status === 'REPORT_READY').length
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-amber-500" /></div>;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Booking Oversight</h1>
          <p className="text-slate-500 mt-1">Monitor all platform bookings and their status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, color: 'bg-slate-100 text-slate-700' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
          { label: 'In Progress', value: stats.inProgress, icon: Beaker, color: 'bg-indigo-100 text-indigo-700' },
          { label: 'Report Ready', value: stats.reportReady, icon: FileText, color: 'bg-teal-100 text-teal-700' },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.color.split(' ')[0])}>
                <stat.icon className={cn('w-5 h-5', stat.color.split(' ')[1])} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {['all', 'booked', 'technician-assigned', 'sample-collected', 'testing', 'report-ready', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as BookingStatus | 'all')}
            className={cn(
              'px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all capitalize',
              statusFilter === status
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300'
            )}
          >
            {status === 'all' ? 'All Bookings' : status.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Booking ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Test & Lab</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="booking-row hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-xs">
                        {booking.id}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-800">{booking.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{booking.testName}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {booking.labName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        <p>{booking.appointmentDate}</p>
                        <p className="text-slate-400">{booking.appointmentTime}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {booking.reportUrl && (
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Contact Patient</DropdownMenuItem>
                            <DropdownMenuItem>Contact Lab</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">No bookings found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

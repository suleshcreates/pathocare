import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  History, Calendar, FlaskConical, ChevronDown, ChevronUp,
  Search, Download, FileText, Building2, Clock, User, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingService } from '@/services/bookingService';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';

/* ── Status configuration with dot colors ── */
const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  'BOOKED': { label: 'Booked', dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  'TECH_ASSIGNED': { label: 'Technician Assigned', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  'SAMPLE_COLLECTED': { label: 'Sample Collected', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  'TESTING': { label: 'Testing', dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'REPORT_READY': { label: 'Report Ready', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'CANCELLED': { label: 'Cancelled', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export function TestHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await bookingService.getPatientBookings(user.id);
        setBookings(data as Booking[]);
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user?.id]);

  useEffect(() => {
    if (containerRef.current && !loading) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.history-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power3.out' }
      );
    }
  }, [searchQuery, loading]);

  const filteredBookings = bookings
    .filter(b =>
      b.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.labName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

  const totalCount = bookings.length;
  const completedCount = bookings.filter(b => b.status === 'REPORT_READY').length;
  const inProgressCount = totalCount - completedCount;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatus = (status: string) => statusConfig[status] || statusConfig['BOOKED'];

  return (
    <div ref={containerRef} className="flex flex-col min-h-0">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-slate-50 pb-3 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:-mx-8 lg:px-8 pt-1">
        <h1 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Test History</h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tests, labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-slate-200 shadow-sm focus:shadow-md transition-shadow text-sm"
          />
        </div>

        {/* Summary pills – horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { label: 'Total', value: totalCount, color: 'bg-slate-100 text-slate-700' },
            { label: 'Completed', value: completedCount, color: 'bg-emerald-50 text-emerald-700' },
            { label: 'In Progress', value: inProgressCount, color: 'bg-amber-50 text-amber-700' },
          ].map(s => (
            <div key={s.label} className={cn('flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold flex-shrink-0', s.color)}>
              <span className="text-base font-bold">{s.value}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── History Cards ── */}
      <div className="space-y-3 mt-1">
        {filteredBookings.map((booking) => {
          const status = getStatus(booking.status);
          const isExpanded = expandedId === booking.id;

          return (
            <div
              key={booking.id}
              className="history-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300"
            >
              {/* Main card content – tappable to expand */}
              <button
                onClick={() => toggleExpand(booking.id)}
                className="w-full text-left p-3.5 sm:p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                    <FlaskConical className="w-5 h-5 text-teal-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug truncate">
                        {booking.testName || 'Unknown Test'}
                      </h3>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      }
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500 truncate">{booking.labName || 'Lab'}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(booking.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

                      {/* Status pill */}
                      <div className={cn('flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', status.bg, status.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                        {status.label}
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* ── Collapsible Detail Panel ── */}
              <div className={cn(
                'overflow-hidden transition-all duration-300',
                isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
              )}>
                <div className="border-t border-slate-100 px-3.5 sm:px-4 py-3 space-y-2.5 bg-slate-50/50">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{booking.collectionType === 'home' ? 'Home Visit' : 'Lab Visit'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3 h-3" />
                      <span>ID: {booking.id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    {booking.status === 'REPORT_READY' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-9 text-xs font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          View Report
                        </Button>
                        {booking.reportUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-9 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-9 text-xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    {booking.status !== 'REPORT_READY' && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Report will be available once testing completes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No test history</h3>
          <p className="text-sm text-slate-400 mt-1">Your completed tests will appear here</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 mt-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result count */}
      {filteredBookings.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-4">
          Showing {filteredBookings.length} of {bookings.length} tests
        </p>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Calendar, Search, User, Phone, Clock, ChevronRight,
  CheckCircle2, UserPlus, Beaker, FileText, MoreHorizontal,
  Home, Building2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { labService } from '@/services/labService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Type definition based on service return
interface Booking {
  id: string;
  patient_id: string;
  test_id: string;
  lab_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  collection_type: 'home' | 'lab-visit';
  address?: string;
  patient?: {
    full_name: string;
    mobile: string;
  };
  test?: {
    test_name: string;
    price: number; // Added price
  };
}

export function BookingManagement() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; bookingId?: string }>({ open: false, action: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [technicians, setTechnicians] = useState<any[]>([]); // New State
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(''); // New State
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchBookings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await labService.getBookings(user.id);
      // Map service data to local Booking interface if needed, or just cast if structure matches
      setBookings(data as any[]);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const data = await labService.getTechnicians();
      setTechnicians(data);
    } catch (error) {
      console.error("Failed to fetch technicians", error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTechnicians();
  }, [user?.id]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.booking-row'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
      );
    }
  }, [loading, bookings, searchQuery, statusFilter]);

  const handleStatusUpdate = async () => {
    if (!actionDialog.bookingId || !actionDialog.action) return;

    // Special handling for automated report generation
    if (actionDialog.action === 'generate') {
      try {
        toast.loading('Generating report...', { id: 'generate' });
        await labService.startTesting(actionDialog.bookingId);
        toast.success('Report generated and sent to patient!', { id: 'generate' });
        fetchBookings();
        setActionDialog({ open: false, action: '' });
      } catch (error: any) {
        console.error('Report generation failed', error);
        toast.error(error.message || 'Failed to generate report', { id: 'generate' });
      }
      return;
    }

    // Special handling for technician assignment
    if (actionDialog.action === 'assign') {
      if (!selectedTechnicianId) {
        toast.error("Please select a technician");
        return;
      }
      try {
        toast.loading('Assigning technician...', { id: 'assign' });
        await labService.assignTechnician(actionDialog.bookingId, selectedTechnicianId);
        toast.success('Technician assigned successfully', { id: 'assign' });
        fetchBookings();
        setActionDialog({ open: false, action: '' });
        setSelectedTechnicianId(''); // Reset selection
      } catch (error: any) {
        console.error('Assignment failed', error);
        toast.error('Failed to assign technician', { id: 'assign' });
      }
      return;
    }

    // Generic status update for other actions
    let newStatus = '';
    switch (actionDialog.action) {
      case 'accept': newStatus = 'BOOKED'; break;
      case 'reject': newStatus = 'REJECTED'; break;
      case 'assign': newStatus = 'TECH_ASSIGNED'; break;
      case 'collect': newStatus = 'SAMPLE_COLLECTED'; break;
      case 'test': newStatus = 'TESTING'; break;
      case 'complete': newStatus = 'REPORT_READY'; break;
    }

    if (!newStatus) return;

    try {
      await labService.updateBookingStatusAndNotify(actionDialog.bookingId, newStatus);
      toast.success(newStatus === 'REJECTED' ? 'Booking rejected' : `Booking updated to ${newStatus}`);
      fetchBookings();
      setActionDialog({ open: false, action: '' });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const pName = booking.patient?.full_name || 'Unknown';
    const tName = booking.test?.test_name || 'Unknown';
    const matchesSearch = pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getActionButtons = (status: string, _id: string) => {
    // DB returns uppercase status, but let's be safe
    const s = status?.toUpperCase();
    switch (s) {
      case 'REQUESTED':
        return [
          { label: 'Accept', icon: CheckCircle2, action: 'accept', color: 'bg-green-600' },
          { label: 'Reject', icon: CheckCircle2, action: 'reject', color: 'bg-red-500' },
        ];
      case 'BOOKED':
        return [
          { label: 'Assign Technician', icon: UserPlus, action: 'assign', color: 'bg-indigo-500' },
        ];
      case 'TECH_ASSIGNED':
        return [
          // Lab waits for technician. No action.
          // Maybe we could show 'Reassign' if needed, but for now empty.
        ];
      case 'SAMPLE_COLLECTED':
        return [
          { label: 'Start Testing', icon: Beaker, action: 'test', color: 'bg-indigo-500' },
        ];
      case 'TESTING':
        return [
          { label: 'Generate Report', icon: FileText, action: 'generate', color: 'bg-teal-500' },
        ];
      case 'REPORT_READY':
        return [
          { label: 'Complete', icon: CheckCircle2, action: 'complete', color: 'bg-emerald-500' },
        ];
      default:
        return [];
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div ref={containerRef} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Booking Management</h1>
          <p className="text-slate-500 mt-1">Manage and process patient bookings</p>
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

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'All Bookings' },
          { id: 'REQUESTED', label: 'New Requests' },
          { id: 'BOOKED', label: 'Booked' },
          { id: 'TECH_ASSIGNED', label: 'Technician Assigned' },
          { id: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
          { id: 'TESTING', label: 'Testing' },
          { id: 'REPORT_READY', label: 'Completed' }, // Use Report Ready as Completed for filter
          { id: 'REJECTED', label: 'Rejected' }
        ].map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={cn(
              'px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all',
              statusFilter === status.id
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Test</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking: any, index: number) => (
                  <tr key={booking.id || index} className="booking-row hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{booking.patientName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.patientMobile || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{booking.testName || 'Unknown Test'}</p>
                      <p className="text-xs text-slate-500">₹{booking.amount || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {booking.date ? new Date(booking.date).toLocaleDateString() : 'No Date'}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {booking.timeSlot || 'No Time'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">
                        {booking.type === 'HOME' || booking.type === 'home' ? (
                          <><Home className="w-3 h-3 mr-1" /> Home</>
                        ) : (
                          <><Building2 className="w-3 h-3 mr-1" /> Lab</>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status as any} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getActionButtons(booking.status, booking.id).map((btn) => (
                          <Button
                            key={btn.action}
                            size="sm"
                            className={cn(btn.color, 'text-white')}
                            onClick={() => setActionDialog({ open: true, action: btn.action, bookingId: booking.id })}
                          >
                            <btn.icon className="w-4 h-4 mr-1" />
                            {btn.label}
                          </Button>
                        ))}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <ChevronRight className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancel Booking</DropdownMenuItem>
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

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionDialog.action === 'assign' && 'Assign Technician'}
              {actionDialog.action === 'collect' && 'Mark Sample Collected'}
              {actionDialog.action === 'test' && 'Start Testing'}
              {actionDialog.action === 'upload' && 'Upload Report'}
              {actionDialog.action === 'complete' && 'Complete Booking'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'accept' && 'Accept this booking request?'}
              {actionDialog.action === 'reject' && 'Reject this booking request?'}
              {actionDialog.action === 'assign' && 'Select a technician to assign to this booking.'}
              {actionDialog.action === 'collect' && 'Confirm that the sample has been collected.'}
              {actionDialog.action === 'test' && 'Begin the testing process for this sample.'}
              {actionDialog.action === 'upload' && 'Upload the test report PDF.'}
              {actionDialog.action === 'complete' && 'Mark this booking as completed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Technician Selection */}
            {actionDialog.action === 'assign' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Select Technician</label>
                  <select
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    value={selectedTechnicianId}
                  >
                    <option value="">-- Select Technician --</option>
                    {technicians.filter(t => t.isActive).map((tech) => (
                      <option
                        key={tech.id}
                        value={tech.id}
                        disabled={tech.isBusy}
                        className={tech.isBusy ? 'text-slate-400' : ''}
                      >
                        {tech.name} {tech.isBusy ? '(Busy)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {technicians.length === 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">No active technicians found. Go to 'Manage Technicians' to add one.</p>
                )}
              </div>
            )}

            {actionDialog.action === 'upload' && (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors relative">
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                />
                <FileText className={cn("w-12 h-12 mx-auto mb-3", selectedFile ? "text-indigo-500" : "text-slate-400")} />
                <p className="text-slate-600 font-medium">
                  {selectedFile ? selectedFile.name : "Drop PDF file here or click to browse"}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Maximum file size: 10MB"}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setActionDialog({ open: false, action: '' })}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                onClick={handleStatusUpdate}
                disabled={actionDialog.action === 'assign' && !selectedTechnicianId}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

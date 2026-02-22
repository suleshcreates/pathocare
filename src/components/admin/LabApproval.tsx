import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Building2, Search, MapPin, Phone,
  CheckCircle2, XCircle, Clock,
  ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService } from '@/services/adminService';
import type { Lab } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function LabApproval() {
  const [searchQuery, setSearchQuery] = useState('');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      // Fetch both active and pending to show in tabs
      const [pending, active] = await Promise.all([
        adminService.getLabs('PENDING'),
        adminService.getLabs('ACTIVE')
      ]);
      setLabs([...pending, ...active]);
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.lab-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [searchQuery, loading]);

  const handleApprove = async () => {
    if (!selectedLab) return;
    try {
      await adminService.approveLab(selectedLab.id);
      toast.success(`Lab ${selectedLab.name} approved successfully`);
      setShowApproveDialog(false);
      // Refresh list
      fetchLabs();
    } catch (error) {
      console.error("Failed to approve lab:", error);
      toast.error("Failed to approve lab");
    }
  };

  const handleReject = async () => {
    if (!selectedLab) return;
    try {
      await adminService.rejectLab(selectedLab.id);
      toast.success(`Lab ${selectedLab.name} rejected/suspended successfully`);
      setShowRejectDialog(false);
      // Refresh list
      fetchLabs();
    } catch (error) {
      console.error("Failed to reject lab:", error);
      toast.error("Failed to reject lab");
    }
  };

  const pendingLabs = labs.filter(lab =>
    !lab.isApproved &&
    (lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.address?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const approvedLabs = labs.filter(lab =>
    lab.isApproved &&
    (lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.address?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const LabCard = ({ lab, isPending }: { lab: Lab; isPending: boolean }) => (
    <Card className="lab-card overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{lab.name}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  {lab.address || 'No address provided'}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Phone className="w-4 h-4" />
                    {lab.phone || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            <Badge className={isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
              {isPending ? (
                <><Clock className="w-3 h-3 mr-1" /> Pending</>
              ) : (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</>
              )}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            {isPending ? (
              <>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => {
                    setSelectedLab(lab);
                    setShowApproveDialog(true);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => {
                    setSelectedLab(lab);
                    setShowRejectDialog(true);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Manage
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                    onClick={() => {
                      setSelectedLab(lab);
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Suspend Lab
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lab Approval</h1>
          <p className="text-slate-500 mt-1">Review and approve laboratory registrations</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full lg:w-64"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Labs', value: labs.length, color: 'bg-slate-100' },
          { label: 'Approved', value: approvedLabs.length, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Pending', value: pendingLabs.length, color: 'bg-amber-100 text-amber-700' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.color.split(' ')[1] || 'text-slate-700')}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingLabs.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedLabs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} isPending={true} />
            ))}
          </div>

          {pendingLabs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">No pending approvals</h3>
              <p className="text-slate-500 mt-1">All lab registrations have been reviewed</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} isPending={false} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Lab Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedLab?.name}? They will be able to receive bookings immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={handleApprove}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Lab
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      {/* Reject/Suspend Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject/Suspend Lab</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject or suspend {selectedLab?.name}? They will no longer be able to accept bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirm Actions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

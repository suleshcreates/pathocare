import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
    Search, Phone,
    CheckCircle2, XCircle, Clock,
    Award, ExternalLink, Loader2, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService } from '@/services/adminService';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DoctorApproval() {
    const [searchQuery, setSearchQuery] = useState('');
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const [pending, active] = await Promise.all([
                adminService.getDoctors('PENDING'),
                adminService.getDoctors('ACTIVE')
            ]);
            setDoctors([...pending, ...active]);
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.querySelectorAll('.doctor-card'),
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
            );
        }
    }, [searchQuery, loading, doctors]);

    const handleApprove = async () => {
        if (!selectedDoctor) return;
        try {
            await adminService.approveDoctor(selectedDoctor.id);
            toast.success(`Doctor ${selectedDoctor.name} approved successfully`);
            setShowApproveDialog(false);
            fetchDoctors();
        } catch (error) {
            console.error("Failed to approve doctor:", error);
            toast.error("Failed to approve doctor");
        }
    };

    const handleReject = async () => {
        setShowRejectDialog(false);
        toast.info("Reject functionality coming soon");
    };

    const filteredDoctors = doctors.filter(doc =>
    (doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const pendingDoctors = filteredDoctors.filter(d => d.status === 'PENDING');
    const approvedDoctors = filteredDoctors.filter(d => d.status === 'ACTIVE');

    const DoctorCard = ({ doctor, isPending }: { doctor: User; isPending: boolean }) => (
        <Card className="doctor-card overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
                <div className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Stethoscope className="w-7 h-7 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">{doctor.name}</h3>
                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                    <Award className="w-3 h-3" />
                                    {doctor.email}
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-sm text-slate-500">
                                        <Phone className="w-4 h-4" />
                                        {doctor.phone || 'N/A'}
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

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        {isPending ? (
                            <>
                                <Button
                                    size="sm"
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                                    onClick={() => {
                                        setSelectedDoctor(doctor);
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
                                        setSelectedDoctor(doctor);
                                        setShowRejectDialog(true);
                                    }}
                                >
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" variant="outline" className="flex-1">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Manage
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div ref={containerRef} className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Doctor Approval</h1>
                    <p className="text-slate-500 mt-1">Review and approve doctor registrations</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search doctors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full lg:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Doctors', value: doctors.length, color: 'bg-slate-100' },
                    { label: 'Approved', value: approvedDoctors.length, color: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Pending', value: pendingDoctors.length, color: 'bg-amber-100 text-amber-700' },
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

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="pending">
                        Pending ({pendingDoctors.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Approved ({approvedDoctors.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingDoctors.map((doc) => (
                            <DoctorCard key={doc.id} doctor={doc} isPending={true} />
                        ))}
                    </div>
                    {pendingDoctors.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700">No pending approvals</h3>
                            <p className="text-slate-500 mt-1">All doctor registrations have been reviewed</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="approved" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {approvedDoctors.map((doc) => (
                            <DoctorCard key={doc.id} doctor={doc} isPending={false} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Doctor Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve {selectedDoctor?.name}? They will be able to access the platform immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowApproveDialog(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={handleApprove}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve Doctor
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Doctor Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject {selectedDoctor?.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleReject}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Doctor
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

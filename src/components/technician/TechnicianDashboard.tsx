import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { labService } from '@/services/labService';
import { toast } from 'sonner';
import { useTechnicianRequests } from '@/hooks/useTechnicianRequests';

export function TechnicianDashboard() {
    const { requests, loading, refresh, updateStatusOptimistic } = useTechnicianRequests();

    const handleCollectSample = async (bookingId: string) => {
        // 1. Optimistic Update (Locks state for 10s)
        updateStatusOptimistic(bookingId, 'SAMPLE_COLLECTED');

        try {
            toast.loading("Updating status...", { id: "collect" });

            await labService.updateStatus(bookingId, 'SAMPLE_COLLECTED');

            toast.success("Sample collected!", { id: "collect" });

            // 2. Delayed Refresh
            setTimeout(() => {
                refresh();
            }, 1500);

        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update status", { id: "collect" });
            refresh(); // Revert on error
        }
    };

    const activeRequests = requests.filter(r => r.status === 'TECH_ASSIGNED');
    // Show newest history first
    const history = requests
        .filter(r => r.status !== 'TECH_ASSIGNED')
        .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Technician Dashboard</h1>
                    <p className="text-slate-500">Manage your sample collections</p>
                </div>
                <Button variant="outline" onClick={refresh} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-600" />
                            Pending Collections
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeRequests.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No pending requests</div>
                        ) : (
                            activeRequests.map(req => (
                                <div key={req.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{req.patientName}</h3>
                                        <p className="text-sm text-slate-600">{req.testName}</p>
                                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                            <span>📅 {req.appointmentDate} at {req.appointmentTime}</span>
                                            <span>📍 {req.address || 'No address provided'}</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="bg-teal-600 hover:bg-teal-700"
                                        onClick={() => handleCollectSample(req.id)}
                                    >
                                        Collect Sample
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-slate-600" />
                            History (Today)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {history.slice(0, 5).map(req => (
                            <div key={req.id} className="flex items-start justify-between text-sm py-2 border-b last:border-0 border-slate-100">
                                <div>
                                    <p className="font-medium text-slate-700">{req.patientName}</p>
                                    <StatusBadge status={req.status} />
                                </div>
                                <span className="text-xs text-slate-400">{req.appointmentTime}</span>
                            </div>
                        ))}
                        {history.length === 0 && <p className="text-slate-400 text-sm text-center">No history yet</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

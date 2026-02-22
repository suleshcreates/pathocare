import { useState, useEffect } from 'react';
import {
    IndianRupee, Activity, Search,
    Download, RefreshCw, Loader2, FlaskConical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminLabPayment {
    payment_id: string;
    amount: number;
    status: string;
    created_at: string;
    lab_id: string;
    users_lab: { full_name: string, email: string, user_metadata?: any } | null;
    users_patient: { full_name: string } | null;
}

export function AdminLabPayouts() {
    const [payments, setPayments] = useState<AdminLabPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('lab_payments')
                .select('payment_id, amount, status, created_at, lab_id, patient_id')
                .order('created_at', { ascending: false });

            if (paymentsError) throw paymentsError;

            // Fetch users based on the IDs
            const userIds = Array.from(new Set(
                (paymentsData || []).flatMap(p => [p.lab_id, p.patient_id]).filter(Boolean)
            ));

            let usersData: any[] = [];
            if (userIds.length > 0) {
                const { data: ud, error: usersError } = await supabase
                    .from('users')
                    .select('user_id, full_name, email')
                    .in('user_id', userIds);
                if (!usersError && ud) {
                    usersData = ud;
                }
            }

            const userMap = new Map(usersData.map(u => [u.user_id, u]));

            const mappedPayments = (paymentsData || []).map(p => ({
                payment_id: p.payment_id,
                amount: p.amount,
                status: p.status,
                created_at: p.created_at,
                lab_id: p.lab_id,
                users_lab: userMap.get(p.lab_id) ? {
                    full_name: userMap.get(p.lab_id).full_name,
                    email: userMap.get(p.lab_id).email,
                    user_metadata: userMap.get(p.lab_id).user_metadata
                } : null,
                users_patient: userMap.get(p.patient_id) ? {
                    full_name: userMap.get(p.patient_id).full_name
                } : null
            }));

            setPayments(mappedPayments as unknown as AdminLabPayment[]);
        } catch (err: any) {
            console.error('Failed to load lab payouts', err);
            toast.error('Failed to load transaction database');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (paymentId: string) => {
        try {
            const { error } = await supabase
                .from('lab_payments')
                .update({ status: 'paid' })
                .eq('payment_id', paymentId);

            if (error) throw error;

            toast.success("Payment marked as settled manually!");
            fetchAllPayments();
        } catch (error) {
            console.error("Error settling payment:", error);
            toast.error("Failed to settle payment");
        }
    };

    const handleSettleAll = async (labId: string) => {
        try {
            const { error } = await supabase
                .from('lab_payments')
                .update({ status: 'paid' })
                .eq('lab_id', labId)
                .eq('status', 'pending');

            if (error) throw error;

            toast.success("All pending payments for laboratory marked as settled!");
            fetchAllPayments();
        } catch (error) {
            console.error("Error settling payments:", error);
            toast.error("Failed to settle payments");
        }
    };

    useEffect(() => {
        fetchAllPayments();
    }, []);

    const totalSystemRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const completedTransactions = payments.filter(p => p.status === 'paid').length;

    // Filter by lab name or email
    const filteredPayments = payments.filter(p => {
        const labName = (p.users_lab?.full_name || '').toLowerCase();
        const labEmail = (p.users_lab?.email || '').toLowerCase();
        const patName = (p.users_patient?.full_name || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return labName.includes(term) || labEmail.includes(term) || patName.includes(term);
    });

    // Group by lab for aggregate view
    const statsByLab = new Map<string, { labId: string, labName: string, email: string, revenue: number, pending: number, bookings: number }>();

    filteredPayments.forEach(p => {
        const labId = p.lab_id || p.users_lab?.email || 'unknown'; // Using ID or email as unique fallback
        const labName = p.users_lab?.full_name || 'Unknown Lab';
        const email = p.users_lab?.email || '';

        if (!statsByLab.has(labId)) {
            statsByLab.set(labId, { labId, labName, email, revenue: 0, pending: 0, bookings: 0 });
        }

        const stats = statsByLab.get(labId)!;
        stats.bookings += 1;

        if (p.status === 'paid') {
            stats.revenue += Number(p.amount);
        } else if (p.status === 'pending') {
            stats.pending += Number(p.amount);
        }
    });

    const labAggregates = Array.from(statsByLab.values()).sort((a, b) => b.revenue - a.revenue);

    return (
        <div className="space-y-6 text-slate-800 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <FlaskConical className="w-6 h-6 mr-2 text-teal-600" />
                        Platform Payouts (Labs)
                    </h1>
                    <p className="text-slate-500 mt-1">Monitor all lab test payments and laboratory earnings</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAllPayments} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 mb-1">Total System Revenue (Labs)</p>
                                <h2 className="text-3xl font-bold flex items-center text-slate-800">
                                    <IndianRupee className="w-6 h-6 mr-1" />
                                    {totalSystemRevenue.toFixed(2)}
                                </h2>
                            </div>
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                <Activity className="w-6 h-6 text-teal-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500">
                            Based on {completedTransactions} paid lab tests
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="labs" className="w-full mt-6">
                <TabsList className="grid w-full max-w-sm grid-cols-2 mb-6">
                    <TabsTrigger value="labs">By Laboratory</TabsTrigger>
                    <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="labs">
                    <Card className="shadow-md border-slate-200">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 border-b border-slate-100 pb-4 gap-4">
                            <CardTitle className="text-lg font-semibold text-slate-700">
                                Laboratory Performance
                            </CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search lab..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Laboratory</th>
                                            <th className="px-6 py-4 font-medium text-center">Total Bookings</th>
                                            <th className="px-6 py-4 font-medium text-right">Pending Payouts</th>
                                            <th className="px-6 py-4 font-medium text-right">Settled Revenue</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && labAggregates.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                                                    Loading data...
                                                </td>
                                            </tr>
                                        ) : labAggregates.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                    No laboratory data found.
                                                </td>
                                            </tr>
                                        ) : (
                                            labAggregates.map((lab, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-teal-700">{lab.labName}</div>
                                                        <div className="text-xs text-slate-500">{lab.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                                                        {lab.bookings}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-medium flex items-center justify-end text-amber-600">
                                                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                            {lab.pending.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-semibold flex items-center justify-end text-emerald-600">
                                                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                            {lab.revenue.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {lab.pending > 0 && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
                                                                onClick={() => handleSettleAll(lab.labId)}
                                                            >
                                                                <Check className="w-4 h-4 mr-1" /> Settle All
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card className="shadow-md border-slate-200">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 border-b border-slate-100 pb-4 gap-4">
                            <CardTitle className="text-lg font-semibold text-slate-700">
                                All Transactions
                            </CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search lab or patient..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Transaction ID</th>
                                            <th className="px-6 py-4 font-medium">Laboratory</th>
                                            <th className="px-6 py-4 font-medium">Paid By (Patient)</th>
                                            <th className="px-6 py-4 font-medium text-center">Status</th>
                                            <th className="px-6 py-4 font-medium text-right">Amount</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                                                    Loading transactions...
                                                </td>
                                            </tr>
                                        ) : filteredPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                    No transactions found matching your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPayments.map(payment => (
                                                <tr key={payment.payment_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                                            month: 'short', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        {payment.payment_id.split('-')[0]}...
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-teal-700">
                                                            {payment.users_lab?.user_metadata?.lab_name || payment.users_lab?.full_name || 'Unknown Lab'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {payment.users_lab?.email || ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800">
                                                            {payment.users_patient?.full_name || 'Patient'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {payment.status === 'paid' ? (
                                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-medium">Paid</Badge>
                                                        ) : payment.status === 'pending' ? (
                                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 font-medium">Pending</Badge>
                                                        ) : (
                                                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 font-medium">Failed</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className={`font-semibold flex items-center justify-end ${payment.status === 'paid' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                            {Number(payment.amount).toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {payment.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                                                onClick={() => handleMarkPaid(payment.payment_id)}
                                                            >
                                                                Settle
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}

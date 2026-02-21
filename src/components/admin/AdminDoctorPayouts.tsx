import { useState, useEffect } from 'react';
import {
    IndianRupee, Activity, Search,
    Download, RefreshCw, Loader2, Landmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminDoctorPayment {
    payment_id: string;
    amount: number;
    status: string;
    created_at: string;
    users_doctor: { full_name: string, email: string } | null; // Doctor info
    users_patient: { full_name: string } | null; // Patient info
}

export function AdminDoctorPayouts() {
    const [payments, setPayments] = useState<AdminDoctorPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            // Using a join to fetch doctor and patient names
            // Supabase allows joining to the same table twice if aliased or through FK names.
            const { data, error } = await supabase
                .from('doctor_payments')
                .select(`
                    payment_id, amount, status, created_at,
                    users_doctor:doctor_id ( full_name, email ),
                    users_patient:patient_id ( full_name )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data as unknown as AdminDoctorPayment[]);
        } catch (err: any) {
            console.error('Failed to load admin payouts', err);
            toast.error('Failed to load transaction database');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPayments();
    }, []);

    const totalSystemRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const completedTransactions = payments.filter(p => p.status === 'paid').length;

    // Filter by doctor name or email
    const filteredPayments = payments.filter(p => {
        const docName = p.users_doctor?.full_name?.toLowerCase() || '';
        const docEmail = p.users_doctor?.email?.toLowerCase() || '';
        const patName = p.users_patient?.full_name?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();
        return docName.includes(term) || docEmail.includes(term) || patName.includes(term);
    });

    return (
        <div className="space-y-6 text-slate-800 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <Landmark className="w-6 h-6 mr-2 text-indigo-600" />
                        Platform Payouts (Doctors)
                    </h1>
                    <p className="text-slate-500 mt-1">Monitor all consultation payments and doctor earnings</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAllPayments} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 mb-1">Total System Revenue (Doctors)</p>
                                <h2 className="text-3xl font-bold flex items-center text-slate-800">
                                    <IndianRupee className="w-6 h-6 mr-1" />
                                    {totalSystemRevenue.toFixed(2)}
                                </h2>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Activity className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500">
                            Based on {completedTransactions} paid consultations
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-md border-slate-200">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 border-b border-slate-100 pb-4 gap-4">
                    <CardTitle className="text-lg font-semibold text-slate-700">
                        All Transactions
                    </CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search doctor or patient..."
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
                                    <th className="px-6 py-4 font-medium">Doctor</th>
                                    <th className="px-6 py-4 font-medium">Paid By (Patient)</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
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
                                                <div className="font-medium text-indigo-700">
                                                    Dr. {payment.users_doctor?.full_name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {payment.users_doctor?.email || ''}
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

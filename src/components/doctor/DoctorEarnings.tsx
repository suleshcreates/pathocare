import { useState, useEffect } from 'react';
import {
    IndianRupee, TrendingUp, Calendar, Clock,
    ArrowUpRight, Loader2, Download, Filter, ReceiptText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DoctorPayment {
    payment_id: string;
    appointment_id: string;
    patient_id: string;
    amount: number;
    status: string;
    created_at: string;
    users: { full_name: string } | null; // Patient info
    doctor_appointments: { consultation_type: string, slot_date: string } | null;
}

export function DoctorEarnings() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<DoctorPayment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEarnings = async () => {
        if (!user?.id) return;
        try {
            // Using a simple join. Note: If RLS is an issue, we might need a stored procedure or bypass 
            // but assuming doctors can view their own payments and corresponding simple details.
            const { data, error } = await supabase
                .from('doctor_payments')
                .select(`
                    payment_id, amount, status, created_at, appointment_id, patient_id,
                    users!doctor_payments_patient_id_fkey ( full_name ),
                    doctor_appointments ( consultation_type )
                `)
                .eq('doctor_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data as unknown as DoctorPayment[]);
        } catch (err: any) {
            console.error('Failed to load earnings', err);
            toast.error('Failed to load earnings history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, [user?.id]);

    const totalEarnings = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingEarnings = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
    const completedTransactions = payments.filter(p => p.status === 'paid').length;

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-teal-600" /></div>;

    return (
        <div className="space-y-6 text-slate-800 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Earnings & Payouts</h1>
                <p className="text-slate-500 mt-1">Track your consultation revenue and transaction history</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md border-0">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-teal-100 mb-1">Total Earnings (Cleared)</p>
                                <h2 className="text-3xl font-bold flex items-center">
                                    <IndianRupee className="w-6 h-6 mr-1" />
                                    {totalEarnings.toFixed(2)}
                                </h2>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-emerald-100">
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                            <span>From {completedTransactions} consultations</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 mb-1">Pending Amount</p>
                                <h2 className="text-2xl font-bold flex items-center text-slate-800">
                                    <IndianRupee className="w-5 h-5 mr-1" />
                                    {pendingEarnings.toFixed(2)}
                                </h2>
                            </div>
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500">
                            <span>Awaiting patient payment flow</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 mb-1">Next Payout Cycle</p>
                                <h2 className="text-2xl font-bold flex items-center text-slate-800">
                                    Monthly
                                </h2>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500">
                            <span>Admin settles at month end</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center text-slate-700">
                        <ReceiptText className="w-5 h-5 mr-2" /> Recent Transactions
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Patient / Details</th>
                                    <th className="px-6 py-4 font-medium text-center">Type</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No recent transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map(payment => (
                                        <tr key={payment.payment_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">
                                                    {payment.users?.full_name || 'Patient'}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5" title={payment.payment_id}>
                                                    #{payment.payment_id.split('-')[0]}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className="bg-slate-100 text-slate-600 font-normal">
                                                    Hospital
                                                </Badge>
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
                                                    <IndianRupee className="w-3.5 h-3.5" />
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
        </div >
    );
}

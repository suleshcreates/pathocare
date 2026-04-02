import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, FileText, Loader2, Calendar, FlaskConical, Building2 } from 'lucide-react';

export function VerifyReport() {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyReport = async () => {
            if (!appointmentId) {
                setError('No report ID provided');
                setLoading(false);
                return;
            }

            try {
                // Fetch report
                const { data: report, error: reportError } = await supabase
                    .from('reports')
                    .select('*')
                    .eq('appointment_id', appointmentId)
                    .single();

                if (reportError || !report) {
                    setError('Report not found. This may not be a valid report.');
                    setLoading(false);
                    return;
                }

                // Fetch appointment details
                const { data: appointment } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('appointment_id', appointmentId)
                    .single();

                let testName = 'Unknown Test';
                let labName = 'Unknown Lab';
                let patientName = 'Patient';

                if (appointment?.test_id) {
                    const { data: test } = await supabase
                        .from('lab_tests')
                        .select('test_name')
                        .eq('test_id', appointment.test_id)
                        .single();
                    if (test) testName = test.test_name;
                }

                if (appointment?.lab_id) {
                    const { data: lab } = await supabase
                        .from('labs')
                        .select('lab_name')
                        .eq('lab_id', appointment.lab_id)
                        .single();
                    if (lab) labName = lab.lab_name;
                }

                if (appointment?.patient_id) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('full_name')
                        .eq('user_id', appointment.patient_id)
                        .single();
                    if (user) patientName = user.full_name;
                }

                // Fetch report values
                const { data: values } = await supabase
                    .from('report_values')
                    .select('*, test_parameters(*)')
                    .eq('appointment_id', appointmentId);

                setReportData({
                    report,
                    appointment,
                    testName,
                    labName,
                    patientName,
                    values: values || []
                });
            } catch (err) {
                console.error('Verification error:', err);
                setError('Failed to verify report');
            } finally {
                setLoading(false);
            }
        };

        verifyReport();
    }, [appointmentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Verifying report...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 to-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Verification Failed</h1>
                    <p className="text-slate-500">{error}</p>
                    <div className="mt-6 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-400">Report ID: {appointmentId?.slice(0, 8).toUpperCase() || '---'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Report Verified</h1>
                            <p className="text-teal-100 text-sm">This report is authentic</p>
                        </div>
                    </div>
                    <p className="text-xs text-teal-200 font-mono">
                        ID: {appointmentId?.slice(0, 8).toUpperCase()}
                    </p>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                            <FlaskConical className="w-4 h-4 text-teal-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Test Name</p>
                                <p className="text-sm font-semibold text-slate-800">{reportData.testName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-teal-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Laboratory</p>
                                <p className="text-sm font-semibold text-slate-800">{reportData.labName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-teal-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Patient</p>
                                <p className="text-sm font-semibold text-slate-800">{reportData.patientName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-teal-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Generated On</p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {new Date(reportData.report.generated_at).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Test Results */}
                    {reportData.values.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Test Results</h3>
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Parameter</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Value</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.values.map((v: any) => (
                                            <tr key={v.id}>
                                                <td className="px-3 py-2 text-slate-700">
                                                    {v.test_parameters?.parameter_name || 'Parameter'}
                                                </td>
                                                <td className="px-3 py-2 font-medium text-slate-800">
                                                    {v.value} {v.test_parameters?.unit || ''}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        v.is_abnormal
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {v.is_abnormal ? 'Abnormal' : 'Normal'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <p className="text-xs text-slate-400 text-center">
                            Verified by PathoCare Diagnostics Platform
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

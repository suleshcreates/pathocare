import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { otpService } from '@/services/otpService';

type AuthMode = 'login' | 'signup' | 'otp' | 'success';

export function TechnicianAuth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        mobile: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', authData.user.id)
                .single();

            if (userData?.role !== 'TECHNICIAN') {
                await supabase.auth.signOut();
                throw new Error('This login is for Technicians only.');
            }

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await otpService.sendOTP(formData.email, formData.fullName);
            setMode('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSignup = async () => {
        setLoading(true);
        setError(null);
        try {
            await otpService.verifyOTP(formData.email, otp);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    mobile: formData.mobile,
                    role: 'TECHNICIAN'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Signup failed');
            }

            setMode('success');
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'success') {
        return (
            <AuthLayout
                roleName="Technician"
                roleColor="amber"
                image="https://images.unsplash.com/photo-1576101917035-2b86c8eb62d5?q=80&w=2070&auto=format&fit=crop"
                title="Account Ready"
                description="Welcome to the phlebotomy team."
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Registration Complete</h3>
                        <p className="text-slate-500 mt-2">Your field technician account has been created. Start accepting sample collection tasks.</p>
                    </div>
                    <Button
                        onClick={() => setMode('login')}
                        className="w-full bg-amber-600 hover:bg-amber-700 h-12 rounded-xl text-lg font-semibold"
                    >
                        Sign In Page
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    if (mode === 'otp') {
        return (
            <AuthLayout
                roleName="Technician"
                roleColor="amber"
                image="https://images.unsplash.com/photo-1576101917035-2b86c8eb62d5?q=80&w=2070&auto=format&fit=crop"
                title="Verify Access"
                description="Securely verify your professional email."
            >
                <div className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-4 text-center text-3xl tracking-[0.4em] font-bold border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            placeholder="000000"
                        />
                    </div>
                    <Button onClick={handleVerifyAndSignup} disabled={loading} className="w-full bg-amber-600 h-14 rounded-2xl">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Verification'}
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            roleName="Technician"
            roleColor="amber"
            image="https://images.unsplash.com/photo-1576101917035-2b86c8eb62d5?q=80&w=2070&auto=format&fit=crop"
            title={mode === 'login' ? "Field Portal" : "Join Fleet"}
            description={mode === 'login' ? "Access your assigned sample collection tasks." : "Partner as a certified lab technician."}
        >
            <form onSubmit={mode === 'login' ? handleLogin : handleSendOTP} className="space-y-4">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm flex gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {mode === 'signup' && (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Michael Scott"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="+91 99999 00000"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500" />
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="technician@pathocare.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500" />
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-600 hover:bg-amber-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-amber-900/10 mt-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'login' ? 'Field Portal Sign In' : 'Join as Phlebotomist')}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-600 font-medium">
                    {mode === 'login' ? "Want to join our fleet?" : "Already registered?"}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                        className="ml-2 text-amber-600 hover:underline font-bold"
                    >
                        {mode === 'login' ? 'Apply Now' : 'Sign In'}
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
}

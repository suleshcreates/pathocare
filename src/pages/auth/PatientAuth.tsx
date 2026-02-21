import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, Phone, Loader2, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { otpService } from '@/services/otpService';

type AuthMode = 'login' | 'signup' | 'otp' | 'success';

export function PatientAuth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState('');

    // Geolocation State
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        mobile: '',
        address: '',
        latitude: null as number | null,
        longitude: null as number | null
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

            // Role Check
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', authData.user.id)
                .single();

            if (userError || userData.role !== 'PATIENT') {
                if (userData?.role === 'LAB') {
                    await supabase.auth.signOut();
                    throw new Error('Labs should use the Lab Portal.');
                }
                await supabase.auth.signOut();
                throw new Error('Unauthorized access.');
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

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        setLocationStatus('Fetching location...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude
                }));

                // Optional: Reverse Geocoding (using OpenStreetMap Nominatim - Free)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data.display_name) {
                        setFormData(prev => ({
                            ...prev,
                            address: data.display_name,
                            latitude,
                            longitude
                        }));
                        setLocationStatus('Location fetched successfully!');
                    } else {
                        setLocationStatus('Location coordinates fetched.');
                    }
                } catch (error) {
                    console.error('Reverse geocoding failed:', error);
                    setLocationStatus('Location coordinates fetched (Address lookup failed).');
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation Error:', error);
                setLocationStatus('Unable to retrieve your location.');
                setLocationLoading(false);
            }
        );
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
                    address: formData.address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    role: 'PATIENT'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Signup failed');
            }

            setMode('success');
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'success') {
        return (
            <AuthLayout
                roleName="Patient"
                roleColor="teal"
                image="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop"
                title="Account Created"
                description="Welcome to PathoCare."
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Registration Successful!</h3>
                        <p className="text-slate-500 mt-2">You can now sign in to book tests and view reports.</p>
                    </div>
                    <Button
                        onClick={() => setMode('login')}
                        className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-xl text-lg font-semibold"
                    >
                        Sign In Now
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    if (mode === 'otp') {
        return (
            <AuthLayout
                roleName="Patient"
                roleColor="teal"
                image="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop"
                title="Verify Email"
                description="Check your inbox for a 6-digit code."
            >
                <div className="space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm flex gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Verification Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-4 text-center text-3xl tracking-[0.4em] font-bold border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-200"
                            placeholder="000000"
                            required
                        />
                    </div>

                    <Button
                        onClick={handleVerifyAndSignup}
                        disabled={otp.length !== 6 || loading}
                        className="w-full bg-teal-600 hover:bg-teal-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-teal-900/10"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Registration'}
                    </Button>

                    <button
                        onClick={() => setMode('signup')}
                        className="w-full py-2 text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
                    >
                        Change Email Address
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            roleName="Patient"
            roleColor="teal"
            image="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop"
            title={mode === 'login' ? "Welcome Back" : "Join PathoCare"}
            description={mode === 'login' ? "Access your test reports and health history." : "Create an account to book tests from home."}
        >
            <form onSubmit={mode === 'login' ? handleLogin : handleSendOTP} className="space-y-5">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {mode === 'signup' && (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1 mb-1">
                                <label className="text-sm font-semibold text-slate-700">Address</label>
                                <button
                                    type="button"
                                    onClick={handleUseLocation}
                                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <MapPin className="w-3 h-3" />
                                    )}
                                    Use Current Location
                                </button>
                            </div>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                <textarea
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none h-20"
                                    placeholder="Your full address..."
                                />
                            </div>
                            {locationStatus && (
                                <p className={`text-xs ml-1 ${locationStatus.includes('Error') ? 'text-rose-500' : 'text-emerald-600'}`}>
                                    {locationStatus}
                                </p>
                            )}
                        </div>
                    </>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-teal-900/10 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-600 font-medium">
                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                        className="ml-2 text-teal-600 hover:underline font-bold"
                    >
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
}

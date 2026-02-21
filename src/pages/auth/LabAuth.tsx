import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Building2, Lock, Smartphone, FileText, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'signup' | 'success';

export function LabAuth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Geolocation State
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        labName: '',
        password: '',
        regNumber: '',
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
            // Auto-generate email from lab name
            const email = formData.labName.toLowerCase().replace(/\s+/g, '_') + '@pathocare.lab';

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password: formData.password,
            });

            if (authError) throw authError;

            // Verify role
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', authData.user.id)
                .single();

            if (userData?.role !== 'LAB') {
                await supabase.auth.signOut();
                throw new Error('This login is for Laboratories only.');
            }

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const labEmail = formData.labName.toLowerCase().replace(/\s+/g, '_') + '@pathocare.lab';

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: labEmail,
                    password: formData.password,
                    fullName: formData.labName,
                    mobile: formData.mobile,
                    role: 'LAB',
                    labName: formData.labName,
                    registrationNumber: formData.regNumber,
                    address: formData.address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
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
                roleName="Laboratory"
                roleColor="indigo"
                image="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop"
                title="Registration Sent"
                description="Your laboratory has been registered."
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Application Under Review</h3>
                        <p className="text-slate-500 mt-2">To maintain our quality standards, every lab is manually verified. You will receive an email once your account is active.</p>
                    </div>
                    <Button
                        onClick={() => setMode('login')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-lg font-semibold"
                    >
                        Return to Sign In
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            roleName="Laboratory"
            roleColor="indigo"
            image="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop"
            title={mode === 'login' ? "Partners Portal" : "Register Your Lab"}
            description={mode === 'login' ? "Manage your specialized tests and digital reports." : "Join India's fastest growing diagnostic network."}
        >
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm flex gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Lab Name</label>
                    <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            required
                            value={formData.labName}
                            onChange={e => setFormData({ ...formData, labName: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. Apollo Diagnostics"
                        />
                    </div>
                </div>

                {mode === 'signup' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Reg. No</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.regNumber}
                                        onChange={e => setFormData({ ...formData, regNumber: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="LAB-2024"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Phone</label>
                                <div className="relative group">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.mobile}
                                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1 mb-1">
                                <label className="text-sm font-semibold text-slate-700">Address</label>
                                <button
                                    type="button"
                                    onClick={handleUseLocation}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
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
                                <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500" />
                                <textarea
                                    required
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                                    placeholder="Complete lab address..."
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
                    <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500" />
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-900/10 mt-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'login' ? 'Sign In Partners' : 'Submit Registration')}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-600 font-medium">
                    {mode === 'login' ? "Want to partner with us?" : "Already have an account?"}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                        className="ml-2 text-indigo-600 hover:underline font-bold"
                    >
                        {mode === 'login' ? 'Register Now' : 'Sign In'}
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User, Shield, Loader2, AlertCircle, CheckCircle2, Phone, IndianRupee, GraduationCap, Clock, FileText, Building2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { otpService } from '@/services/otpService';

type AuthMode = 'login' | 'signup' | 'otp' | 'success';

export function DoctorAuth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        mobile: '',
        specialization: '',
        regNumber: '',
        consultationFee: '500',
        experienceYears: '',
        qualification: '',
        bio: '',
        workingHospital: '',
        profileImg: ''
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

            if (userData?.role !== 'DOCTOR') {
                await supabase.auth.signOut();
                throw new Error('This login is for Doctors only.');
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
                    role: 'DOCTOR',
                    specialization: formData.specialization,
                    medicalRegNo: formData.regNumber,
                    consultationFee: parseFloat(formData.consultationFee) || 500,
                    experienceYears: parseInt(formData.experienceYears) || 0,
                    qualification: formData.qualification,
                    bio: formData.bio,
                    workingHospital: formData.workingHospital,
                    profileImg: formData.profileImg
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
                roleName="Doctor"
                roleColor="purple"
                image="https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=2070&auto=format&fit=crop"
                title="Account Created"
                description="Your medical profile has been sent for verification."
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm rotate-3 hover:rotate-0 transition-transform">
                        <CheckCircle2 className="w-10 h-10 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Verification in Progress</h3>
                        <p className="text-slate-500 mt-2">To maintain medical integrity, our team will verify your registration number. You will be notified via email within 24 hours.</p>
                    </div>
                    <Button
                        onClick={() => setMode('login')}
                        className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl text-lg font-semibold"
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
                roleName="Doctor"
                roleColor="purple"
                image="https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=2070&auto=format&fit=crop"
                title="Secure Verification"
                description="Please enter the code sent to your professional email."
            >
                <div className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-4 text-center text-3xl tracking-[0.4em] font-bold border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="000000"
                        />
                    </div>
                    <Button onClick={handleVerifyAndSignup} disabled={loading} className="w-full bg-purple-600 h-14 rounded-2xl">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify Credentials'}
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            roleName="Doctor"
            roleColor="purple"
            image="https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=2070&auto=format&fit=crop"
            title={mode === 'login' ? "Clinician Access" : "Join Network"}
            description={mode === 'login' ? "Review patient diagnostic history and reports." : "Provide expert consultation and manage patient checkups."}
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
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Dr. John Smith"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Working Hospital/Clinic</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.workingHospital}
                                    onChange={e => setFormData({ ...formData, workingHospital: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="City General Hospital"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Profile Image URL (Optional)</label>
                            <div className="relative group">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="url"
                                    value={formData.profileImg}
                                    onChange={e => setFormData({ ...formData, profileImg: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Specialization</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.specialization}
                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Cardiology"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Reg. No</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.regNumber}
                                        onChange={e => setFormData({ ...formData, regNumber: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="MCI-1234"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Qualification</label>
                                <div className="relative group">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.qualification}
                                        onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="MBBS, MD"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Experience</label>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.experienceYears}
                                        onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="5 yrs"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Consultation Fee (₹)</label>
                            <div className="relative group">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500" />
                                <input
                                    type="number"
                                    min="100"
                                    required
                                    value={formData.consultationFee}
                                    onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="500"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Short Bio</label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    placeholder="Brief description of your practice and expertise..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Work Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500" />
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="doctor@hospital.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500" />
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-purple-900/10 mt-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'login' ? 'Clinician Sign In' : 'Join as Specialist')}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-600 font-medium">
                    {mode === 'login' ? "Not a member yet?" : "Existing Doctor?"}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                        className="ml-2 text-purple-600 hover:underline font-bold"
                    >
                        {mode === 'login' ? 'Register Now' : 'Sign In'}
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
}

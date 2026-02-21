import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FlaskConical, User, Building2, Stethoscope, ArrowLeft, Mail, Check, Loader2, Microscope } from 'lucide-react';
import { otpService } from '@/services/otpService';

type SignupRole = 'PATIENT' | 'LAB' | 'DOCTOR' | 'TECHNICIAN';

interface FormData {
    // Common fields
    email: string;
    password: string;
    fullName: string;
    mobile: string;
    // Lab-specific
    labName: string;
    registrationNumber: string;
    address: string;
    // Doctor-specific
    specialization: string;
    medicalRegNo: string;
}

type SignupStep = 'role' | 'form' | 'otp' | 'success';

export function Signup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleFromUrl = searchParams.get('role')?.toUpperCase() as SignupRole | null;

    // If role is in URL, skip role selection step
    const initialStep: SignupStep = roleFromUrl && ['PATIENT', 'LAB', 'DOCTOR', 'TECHNICIAN'].includes(roleFromUrl) ? 'form' : 'role';
    const initialRole: SignupRole | null = roleFromUrl && ['PATIENT', 'LAB', 'DOCTOR', 'TECHNICIAN'].includes(roleFromUrl) ? roleFromUrl : null;

    const [step, setStep] = useState<SignupStep>(initialStep);
    const [selectedRole, setSelectedRole] = useState<SignupRole | null>(initialRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        fullName: '',
        mobile: '',
        labName: '',
        registrationNumber: '',
        address: '',
        specialization: '',
        medicalRegNo: '',
    });

    const updateForm = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const roleConfig = {
        PATIENT: {
            icon: User,
            title: 'Patient',
            description: 'Book tests and get reports',
            color: 'teal',
        },
        LAB: {
            icon: Building2,
            title: 'Laboratory',
            description: 'Manage tests and reports',
            color: 'indigo',
        },
        DOCTOR: {
            icon: Stethoscope,
            title: 'Doctor',
            description: 'Review patient reports',
            color: 'purple',
        },
        TECHNICIAN: {
            icon: Microscope,
            title: 'Technician',
            description: 'Join as a phlebotomist',
            color: 'amber',
        },
    };

    // Step 1: Send OTP (skip for LAB)
    const handleSendOTP = async () => {
        // For LAB, skip OTP and go directly to signup
        if (selectedRole === 'LAB') {
            await handleDirectSignup();
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await otpService.sendOTP(formData.email, formData.fullName);
            setOtpSent(true);
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Direct signup without OTP (for LAB)
    const handleDirectSignup = async () => {
        setLoading(true);
        setError(null);
        try {
            // Auto-generate email from lab name
            const labEmail = formData.labName.toLowerCase().replace(/\s+/g, '_') + '@pathocare.lab';

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: labEmail,
                    password: formData.password,
                    fullName: formData.fullName || formData.labName,
                    mobile: formData.mobile,
                    role: 'LAB',
                    labName: formData.labName,
                    registrationNumber: formData.registrationNumber,
                    address: formData.address,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Signup failed');
            }

            setStep('success');
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and create account
    const handleVerifyAndSignup = async () => {
        setLoading(true);
        setError(null);

        try {
            // Verify OTP first
            await otpService.verifyOTP(formData.email, otp);

            // Call backend signup endpoint (bypasses rate limits & handles profile creation)
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    mobile: formData.mobile,
                    role: selectedRole || 'PATIENT',
                    // Role-specific fields
                    labName: formData.labName,
                    registrationNumber: formData.registrationNumber,
                    address: formData.address,
                    specialization: formData.specialization,
                    medicalRegNo: formData.medicalRegNo,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Signup failed');
            }

            setStep('success');
        } catch (err: any) {
            console.error('Signup error details:', err);

            // Show more specific error message
            let errorMessage = 'Signup failed';
            if (err?.message) {
                errorMessage = err.message;
            }
            if (err?.code === '23505') {
                errorMessage = 'An account with this email already exists.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Render role selection
    const renderRoleSelection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-700 text-center mb-6">I am a...</h3>
            <div className="grid gap-4">
                {(Object.keys(roleConfig) as SignupRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                        <button
                            key={role}
                            onClick={() => {
                                setSelectedRole(role);
                                setStep('form');
                            }}
                            className={`p-4 border-2 rounded-xl text-left transition-all hover:border-${config.color}-500 hover:bg-${config.color}-50 flex items-center gap-4`}
                        >
                            <div className={`w-12 h-12 bg-${config.color}-100 rounded-xl flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 text-${config.color}-600`} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800">{config.title}</h4>
                                <p className="text-sm text-slate-500">{config.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Render form based on role
    const renderForm = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-4">
            <button
                type="button"
                onClick={() => setStep('role')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Change role
            </button>

            {/* Common Fields */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateForm('fullName', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="John Doe"
                    required
                />
            </div>

            {/* Email - hide for LAB */}
            {selectedRole !== 'LAB' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        placeholder="you@example.com"
                        required
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => updateForm('mobile', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="+91 98765 43210"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="••••••••"
                    minLength={6}
                    required
                />
            </div>

            {/* Lab-specific fields */}
            {selectedRole === 'LAB' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lab Name</label>
                        <input
                            type="text"
                            value={formData.labName}
                            onChange={(e) => updateForm('labName', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="ABC Diagnostics"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                        <input
                            type="text"
                            value={formData.registrationNumber}
                            onChange={(e) => updateForm('registrationNumber', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="LAB-2024-XXXX"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => updateForm('address', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="123 Medical Lane, City"
                            rows={2}
                            required
                        />
                    </div>
                </>
            )}

            {/* Doctor-specific fields */}
            {selectedRole === 'DOCTOR' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Medical Registration No.</label>
                        <input
                            type="text"
                            value={formData.medicalRegNo}
                            onChange={(e) => updateForm('medicalRegNo', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="MCI-XXXX-XXXX"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                        <input
                            type="text"
                            value={formData.specialization}
                            onChange={(e) => updateForm('specialization', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="General Physician, Cardiologist, etc."
                            required
                        />
                    </div>
                </>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Creating Account...' : selectedRole === 'LAB' ? 'Create Lab Account' : 'Verify Email'}
            </Button>
        </form>
    );

    // Render OTP verification
    const renderOTPVerification = () => (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Verify Your Email</h3>
                <p className="text-slate-500 text-sm mt-1">
                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                </p>
            </div>

            <div>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="------"
                    maxLength={6}
                />
            </div>

            <Button
                onClick={handleVerifyAndSignup}
                disabled={otp.length !== 6 || loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Verifying...' : 'Verify & Create Account'}
            </Button>

            <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full text-sm text-slate-500 hover:text-teal-600"
            >
                Didn't receive the code? Resend
            </button>
        </div>
    );

    // Render success
    const renderSuccess = () => (
        <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-slate-800">Account Created!</h3>
                {selectedRole === 'PATIENT' ? (
                    <p className="text-slate-500 mt-2">You can now sign in and start booking tests.</p>
                ) : (
                    <p className="text-slate-500 mt-2">
                        Your account is pending approval. You'll be notified once verified.
                    </p>
                )}
            </div>
            <Button onClick={() => navigate('/login')} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                Go to Login
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <FlaskConical className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
                    <p className="text-slate-500">Join PathoCare today</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {step === 'role' && renderRoleSelection()}
                {step === 'form' && renderForm()}
                {step === 'otp' && renderOTPVerification()}
                {step === 'success' && renderSuccess()}

                {step !== 'success' && (
                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

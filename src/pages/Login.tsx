import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Building2, User, Loader2, AlertCircle, FlaskConical } from 'lucide-react';

type LoginMode = 'patient' | 'lab';

export function Login() {
    const [mode, setMode] = useState<LoginMode>('lab');
    const [identifier, setIdentifier] = useState(''); // lab name or email
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let email = identifier;

            // For labs, convert lab name to email format
            if (mode === 'lab') {
                email = identifier.toLowerCase().replace(/\s+/g, '_') + '@pathocare.lab';
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    throw new Error(mode === 'lab' ? 'Invalid lab name or password' : 'Invalid email or password');
                }
                throw authError;
            }

            // Verify user role
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, status')
                .eq('user_id', authData.user.id)
                .single();

            if (userError) {
                console.error('User fetch error:', userError);
                return;
            }

            // Check role matches login mode
            if (mode === 'lab' && userData.role !== 'LAB') {
                await supabase.auth.signOut();
                throw new Error('This login is for laboratories only. Use Patient/Doctor login.');
            }

            if (mode === 'patient' && userData.role === 'LAB') {
                await supabase.auth.signOut();
                throw new Error('Labs should use Lab Login tab.');
            }

            if (userData.status === 'REJECTED') {
                await supabase.auth.signOut();
                throw new Error('Your account has been rejected.');
            }

            // Success - App.tsx will redirect based on role
        } catch (err: any) {
            setError(err.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <FlaskConical className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                    <p className="text-slate-500">Sign in to PathoCare</p>
                </div>

                {/* Login Mode Tabs */}
                <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => { setMode('lab'); setError(null); setIdentifier(''); }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'lab'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Lab Login
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('patient'); setError(null); setIdentifier(''); }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'patient'
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Patient / Doctor
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {mode === 'lab' ? 'Lab Name' : 'Email'}
                        </label>
                        <input
                            type={mode === 'lab' ? 'text' : 'email'}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 ${mode === 'lab' ? 'focus:ring-indigo-500' : 'focus:ring-teal-500'
                                } focus:border-transparent outline-none transition-all`}
                            placeholder={mode === 'lab' ? 'PathoCare Diagnostics' : 'you@example.com'}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 ${mode === 'lab' ? 'focus:ring-indigo-500' : 'focus:ring-teal-500'
                                } focus:border-transparent outline-none transition-all`}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className={`w-full ${mode === 'lab' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-teal-500 hover:bg-teal-600'} text-white`}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link
                        to={mode === 'lab' ? '/signup?role=lab' : '/signup'}
                        className={`${mode === 'lab' ? 'text-indigo-600' : 'text-teal-600'} font-medium hover:underline`}
                    >
                        {mode === 'lab' ? 'Register Lab' : 'Sign up'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

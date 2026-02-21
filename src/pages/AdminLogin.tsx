import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Loader2, AlertCircle } from 'lucide-react';

export function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Authenticate with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user found');

            // 2. Strict Role Check
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', authData.user.id)
                .single();

            if (userError) {
                // If we can't verify role, sign out immediately
                await supabase.auth.signOut();
                throw new Error('Failed to verify admin privileges');
            }

            if (userData?.role !== 'ADMIN') {
                await supabase.auth.signOut();
                throw new Error('Unauthorized: Access restricted to Administrators only.');
            }

            // 3. Success - App.tsx/AuthContext will handle the redirect to dashboard
            // We can manually navigate to ensure smoothness
            navigate('/dashboard');

        } catch (err: any) {
            console.error('Admin login error:', err);
            setError(err.message || 'Failed to login');
            // Ensure we are signed out if anything failed after auth
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                await supabase.auth.signOut();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-12 transition-transform hover:rotate-0">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h2>
                    <p className="text-slate-400 mt-2">Restricted Access</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl flex items-start gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email Address</label>
                        <div className="relative group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-4 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                placeholder="admin@pathocare.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Dashboard'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                    <p className="text-xs text-slate-500">
                        Unauthorized access attempts will be logged.
                    </p>
                </div>
            </div>
        </div>
    );
}

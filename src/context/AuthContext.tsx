import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';

import { supabase } from '@/lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isLoading: boolean;
    login: (role?: UserRole) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                handleUser(session.user);
            } else {
                // If no session, clear everything
                setUser(null);
                setRole(null);
                setIsLoading(false);
            }
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                handleUser(session.user);
            } else {
                setUser(null);
                setRole(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUser = async (supabaseUser: any) => {
        // Fetch real role/status from DB
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .single();

        const userRole = profile?.role || supabaseUser.user_metadata?.role || 'patient';
        // Note: We could check profile.status here to block suspended users globally

        const mappedUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            role: userRole,
            status: profile?.status, // Map status from DB
            avatar: supabaseUser.user_metadata?.avatar_url,
            phone: profile?.mobile || supabaseUser.phone,
            address: profile?.address
        };

        setUser(mappedUser);
        setRole(userRole);
        setIsLoading(false);
    };

    const login = async (_role: UserRole = 'patient') => {
        // NOTE: Real login should be done via supabase.auth.signInWithPassword directly in the components.
        // This function is kept for interface compatibility but warns the developer.
        console.warn("AuthContext.login() is deprecated. Use supabase.auth.signInWithPassword() instead.");
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        localStorage.removeItem('pathocare_user');
    };

    return (
        <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

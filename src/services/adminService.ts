import { supabase } from '@/lib/supabase';
import type { User, Lab, DashboardStats } from '@/types';

export const adminService = {
    // Get Dashboard Stats
    async getStats(): Promise<DashboardStats> {
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });

        const { count: totalLabs } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'LAB');

        const { count: totalBookings } = await supabase.from('appointments').select('*', { count: 'exact', head: true });

        const { count: pendingBookings } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'booked');

        const { count: completedTests } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Revenue calculation
        const { data: revenueData } = await supabase
            .from('appointments')
            .select(`
            test:lab_tests(price)
        `)
            .eq('status', 'completed');

        const revenue = revenueData?.reduce((acc, curr: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const price = Array.isArray(curr.test) ? curr.test[0]?.price : curr.test?.price;
            return acc + (price || 0);
        }, 0) || 0;

        return {
            totalUsers: totalUsers || 0,
            totalLabs: totalLabs || 0,
            totalBookings: totalBookings || 0,
            pendingBookings: pendingBookings || 0,
            completedTests: completedTests || 0,
            revenue: revenue
        };
    },

    // Get Users
    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(u => ({
            id: u.user_id || u.id,
            name: u.full_name,
            email: u.email,
            role: u.role,
            status: u.status,
            phone: u.mobile,
            address: u.address,
            avatar: u.avatar_url,
            registrationNumber: u.registration_number
        }));
    },

    // Get Labs
    async getLabs(status?: 'PENDING' | 'ACTIVE' | 'REJECTED'): Promise<Lab[]> {
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'LAB');

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(u => ({
            id: u.user_id || u.id,
            name: u.lab_name || u.full_name,
            email: u.email,
            phone: u.mobile,
            address: u.address,
            isApproved: u.status === 'ACTIVE',
            rating: 0,
            accreditation: [],
            services: [],
            image: u.avatar_url
        }));
    },

    // Approve Lab
    async approveLab(labId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'ACTIVE' })
            .eq('user_id', labId);

        if (error) throw error;
    },

    // Get Doctors
    async getDoctors(status?: 'PENDING' | 'ACTIVE' | 'REJECTED'): Promise<User[]> {
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'DOCTOR'); // Match DB uppercase convention like LAB

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(u => ({
            id: u.user_id || u.id,
            name: u.full_name,
            email: u.email,
            role: 'doctor', // Explicitly cast or map
            status: u.status,
            phone: u.mobile,
            address: u.address,
            avatar: u.avatar_url
        }));
    },

    // Approve Doctor
    async approveDoctor(doctorId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'ACTIVE' })
            .eq('user_id', doctorId);

        if (error) throw error;
    },

    // Get Analytics Data
    async getAnalytics() {
        const { data: bookings, error } = await supabase
            .from('appointments')
            .select(`
                created_at,
                status,
                lab_id,
                lab:users!appointments_lab_id_fkey(full_name, user_metadata), 
                test:lab_tests(price, category)
            `);

        if (error) throw error;

        // 1. Monthly Data
        const monthlyData: Record<string, number> = {};
        const revenueTrend: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthLabel = months[d.getMonth()];
            monthlyData[monthLabel] = 0;
            revenueTrend[monthLabel] = 0;
        }

        bookings?.forEach(booking => {
            const date = new Date(booking.created_at);
            const monthLabel = months[date.getMonth()];
            if (monthlyData.hasOwnProperty(monthLabel)) {
                monthlyData[monthLabel]++;
                // @ts-ignore
                if (booking.status === 'completed') {
                    // @ts-ignore
                    revenueTrend[monthLabel] += (booking.test?.price || 0);
                }
            }
        });

        // 2. Test Categories
        const categoryCounts: Record<string, number> = {};
        bookings?.forEach(booking => {
            // @ts-ignore
            const cat = booking.test?.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // 3. Top Labs
        const labCounts: Record<string, { name: string; bookings: number }> = {};
        bookings?.forEach(booking => {
            const labId = booking.lab_id;
            // @ts-ignore
            const labName = booking.lab?.user_metadata?.lab_name || booking.lab?.full_name || 'Unknown Lab';

            if (!labCounts[labId]) {
                labCounts[labId] = { name: labName, bookings: 0 };
            }
            labCounts[labId].bookings++;
        });

        const topLabs = Object.values(labCounts)
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5)
            .map(l => ({ ...l, rating: 0 }));

        return {
            monthlyBookings: Object.entries(monthlyData).map(([label, value]) => ({ label, value, color: 'bg-teal-500' })),
            revenueTrend: Object.values(revenueTrend),
            testCategories: Object.entries(categoryCounts).map(([label, value]) => ({ label, value, color: 'bg-indigo-400' })),
            topLabs
        };
    }
};

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
            .eq('status', 'BOOKED');

        const { count: completedTests } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'REPORT_READY');

        // Revenue calculation (Lab Revenue via Appointments)
        const { data: labRevenueData } = await supabase
            .from('appointments')
            .select(`
                test_id,
                test:lab_tests(price)
            `)
            .eq('status', 'REPORT_READY');

        const labRevenue = labRevenueData?.reduce((acc, curr: any) => {
            const price = Array.isArray(curr.test) ? curr.test[0]?.price : curr.test?.price;
            return acc + (price || 0);
        }, 0) || 0;

        // Revenue calculation (Doctor Payments)
        const { data: docPayments } = await supabase
            .from('doctor_payments')
            .select('amount')
            .eq('status', 'paid');

        const docRevenue = docPayments?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

        const totalRevenue = labRevenue + docRevenue;

        return {
            totalUsers: totalUsers || 0,
            totalLabs: totalLabs || 0,
            totalBookings: totalBookings || 0,
            pendingBookings: pendingBookings || 0,
            completedTests: completedTests || 0,
            revenue: totalRevenue
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

        const { data: usersData, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch corresponding lab profile data for addresses
        const labIds = usersData.map(u => u.user_id || u.id);
        let labDataMap = new Map();

        if (labIds.length > 0) {
            const { data: labsData } = await supabase
                .from('labs')
                .select('*')
                .in('lab_id', labIds);

            labDataMap = new Map(labsData?.map(l => [l.lab_id, l]) || []);
        }

        return usersData.map(u => {
            const extraData = labDataMap.get(u.user_id || u.id) || {};
            return {
                id: u.user_id || u.id,
                name: u.lab_name || u.user_metadata?.lab_name || u.user_metadata?.labName || u.full_name || extraData.lab_name,
                email: u.email,
                phone: u.mobile || u.user_metadata?.mobile || u.user_metadata?.phone || extraData.phone,
                address: u.address || u.user_metadata?.address || extraData.address,
                isApproved: u.status === 'ACTIVE',
                rating: 0,
                accreditation: [],
                services: [],
                image: u.avatar_url
            };
        });
    },

    // Approve Lab
    async approveLab(labId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'ACTIVE' })
            .eq('user_id', labId);

        if (error) throw error;
    },

    // Reject/Suspend Lab
    async rejectLab(labId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'REJECTED' })
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
        const { data: bookings, error: bookingsError } = await supabase
            .from('appointments')
            .select(`
                created_at,
                status,
                lab_id,
                test_id,
                lab:users!appointments_lab_id_fkey(full_name)
            `);

        if (bookingsError) throw bookingsError;

        const { data: tests, error: testsError } = await supabase
            .from('lab_tests')
            .select('test_id, price, category');

        if (testsError) throw testsError;

        // Map tests for quick lookup
        const testMap = new Map(tests?.map(t => [t.test_id, t]));

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
            const test = testMap.get(booking.test_id);

            if (monthlyData.hasOwnProperty(monthLabel)) {
                monthlyData[monthLabel]++;
                if (booking.status === 'REPORT_READY') {
                    revenueTrend[monthLabel] += (test?.price || 0);
                }
            }
        });

        // 2. Test Categories
        const categoryCounts: Record<string, number> = {};
        bookings?.forEach(booking => {
            const test = testMap.get(booking.test_id);
            const cat = test?.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // 3. Top Labs
        const labCounts: Record<string, { name: string; bookings: number }> = {};
        bookings?.forEach(booking => {
            const labId = booking.lab_id;
            // @ts-ignore
            const labName = booking.lab?.full_name || 'Unknown Lab';

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
    },

    // Get Admin Bookings Oversight
    async getBookings(): Promise<any[]> {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: false });

        if (error) throw error;
        if (!appointments || appointments.length === 0) return [];

        const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
        const labIds = [...new Set(appointments.map(a => a.lab_id).filter(Boolean))];
        const testIds = [...new Set(appointments.map(a => a.test_id).filter(Boolean))];

        const [patientsRes, labsRes, testsRes] = await Promise.all([
            supabase.from('users').select('user_id, full_name').in('user_id', patientIds),
            supabase.from('users').select('user_id, full_name, user_metadata').in('user_id', labIds),
            supabase.from('lab_tests').select('test_id, test_name').in('test_id', testIds)
        ]);

        const patientMap = new Map(patientsRes.data?.map(p => [p.user_id, p.full_name]) || []);
        const labMap = new Map(labsRes.data?.map(l => [l.user_id, l.user_metadata?.lab_name || l.user_metadata?.labName || l.full_name]) || []);
        const testMap = new Map(testsRes.data?.map(t => [t.test_id, t.test_name]) || []);

        return appointments.map(b => ({
            id: b.appointment_id,
            patientName: patientMap.get(b.patient_id) || 'Unknown Patient',
            labName: labMap.get(b.lab_id) || 'Unknown Lab',
            testName: testMap.get(b.test_id) || 'Unknown Test',
            appointmentDate: new Date(b.appointment_date).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
            }),
            appointmentTime: b.appointment_time,
            status: b.status,
            reportUrl: b.report_url
        }));
    }
};

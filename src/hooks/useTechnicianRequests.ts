import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export function useTechnicianRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Store IDs of items that are currently being updated locally
    // We map ID -> Timestamp when the lock expires
    const requestLocks = useRef<Map<string, number>>(new Map());

    const fetchRequests = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch appointments first
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('assigned_technician_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!appointments || appointments.length === 0) {
                setRequests([]);
                setLoading(false);
                return;
            }

            // Manual joins
            const patientIds = [...new Set(appointments.map((a: any) => a.patient_id))];
            const testIds = [...new Set(appointments.map((a: any) => a.test_id))];

            const { data: patients } = await supabase
                .from('users')
                .select('user_id, full_name, mobile')
                .in('user_id', patientIds);

            const { data: patientsExtras } = await supabase
                .from('patients')
                .select('patient_id, address')
                .in('patient_id', patientIds);

            const { data: tests } = await supabase
                .from('lab_tests')
                .select('test_id, test_name')
                .in('test_id', testIds);

            const mapped: Booking[] = appointments.map((d: any) => {
                const patient = patients?.find(p => p.user_id === d.patient_id);
                const patientExtra = patientsExtras?.find(p => p.patient_id === d.patient_id);
                const test = tests?.find(t => t.test_id === d.test_id);

                return {
                    id: d.appointment_id || d.id,
                    patientId: d.patient_id,
                    patientName: patient?.full_name || 'Unknown',
                    testId: d.test_id,
                    testName: test?.test_name || 'Unknown',
                    labId: d.lab_id,
                    labName: 'My Lab',
                    status: d.status,
                    collectionType: d.collection_type,
                    appointmentDate: d.appointment_date,
                    appointmentTime: d.time_slot || d.appointment_time,
                    address: d.address || patientExtra?.address,
                    bookedAt: d.created_at
                };
            });

            // Smart Merge: Only update items that are NOT locked
            setRequests(prev => {
                const now = Date.now();

                // Cleanup expired locks
                for (const [id, expiry] of requestLocks.current.entries()) {
                    if (now > expiry) {
                        requestLocks.current.delete(id);
                    }
                }

                // If previous state is empty, just take new data
                if (prev.length === 0) return mapped;

                // Merge: prefer locked local state over server state
                return mapped.map(serverItem => {
                    if (requestLocks.current.has(serverItem.id)) {
                        const localItem = prev.find(p => p.id === serverItem.id);
                        if (localItem && localItem.status === 'SAMPLE_COLLECTED' && serverItem.status === 'TECH_ASSIGNED') {
                            return localItem; // Keep local optimistic state
                        }
                    }
                    return serverItem;
                });
            });

        } catch (error) {
            console.error('Failed to fetch requests:', error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const updateStatusOptimistic = (id: string, newStatus: string) => {
        // 1. Lock this item for 10 seconds
        requestLocks.current.set(id, Date.now() + 10000);

        // 2. Update local state immediately
        setRequests(prev => prev.map(r =>
            r.id === id ? { ...r, status: newStatus as any } : r
        ));
    };

    return {
        requests,
        loading,
        refresh: fetchRequests,
        updateStatusOptimistic
    };
}

import { supabase } from '@/lib/supabase';
import { sendNewLabBookingEmail } from '@/services/emailService';
import type { Booking } from '@/types';

export const bookingService = {
    // Check Lab Capacity (Safe Mode)
    async checkCapacity(labId: string, date: string) {
        try {
            // 1. Get Lab Capacity
            const { data: labData, error: labError } = await supabase
                .from('labs')
                .select('daily_capacity')
                .eq('lab_id', labId)
                .single();

            if (labError) {
                // If column doesn't exist (schema outdated), allow booking (infinite capacity)
                if (labError.code === '42703' || labError.message?.includes('does not exist')) {
                    console.warn('daily_capacity column missing, skipping check.');
                    return { available: true, current: 0, max: 999 };
                }
                throw labError;
            }

            const maxCapacity = labData?.daily_capacity || 20;

            // 2. Count existing bookings...
            const { count, error: countError } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('lab_id', labId)
                .eq('appointment_date', date)
                .neq('status', 'REJECTED')
                .neq('status', 'CANCELLED');

            if (countError) throw countError;

            return {
                available: (count || 0) < maxCapacity,
                current: count || 0,
                max: maxCapacity
            };
        } catch (error) {
            console.warn('Capacity check failed, proceeding anyway:', error);
            return { available: true, current: 0, max: 999 };
        }
    },

    // Create a new booking (Safe Mode)
    async createBooking(booking: any) {
        // Step 0: Check Capacity (Soft Fail)
        const capacity = await this.checkCapacity(booking.labId, booking.appointmentDate);
        if (!capacity.available) {
            throw new Error(`Lab is fully booked for ${booking.appointmentDate}. Capacity: ${capacity.max}`);
        }

        const appointmentPayload = {
            patient_id: booking.patientId,
            test_id: booking.testId,
            lab_id: booking.labId,
            appointment_date: booking.appointmentDate,
            time_slot: booking.appointmentTime,
            collection_type: booking.collectionType?.toUpperCase() || 'HOME',
            address: booking.address,
            // Try REQUESTED first, but define it here cleanly
            status: 'REQUESTED'
        };

        try {
            // Step 1: Try creating Appointment with REQUESTED status
            let { data, error } = await supabase
                .from('appointments')
                .insert([appointmentPayload])
                .select()
                .single();

            if (error) {
                // If invalid input value for enum appointment_status: "REQUESTED"
                if (error.code === '22P02' || error.message?.includes('invalid input value for enum')) {
                    console.warn('REQUESTED status not supported, retrying with BOOKED...');
                    // Retry with older BOOKED status
                    const { data: retryData, error: retryError } = await supabase
                        .from('appointments')
                        .insert([{ ...appointmentPayload, status: 'BOOKED' }])
                        .select()
                        .single();

                    if (retryError) throw retryError;
                    data = retryData; // use data for email below
                } else {
                    throw error;
                }
            }

            // Step 2: Notify Lab and Patient via EmailJS
            try {
                const { data: labData } = await supabase.from('users').select('full_name, email').eq('user_id', booking.labId).maybeSingle();
                const { data: patData } = await supabase.from('users').select('full_name, email').eq('user_id', booking.patientId).maybeSingle();
                const { data: testData } = await supabase.from('lab_tests').select('test_name').eq('test_id', booking.testId).maybeSingle();

                if (labData && patData) {
                    sendNewLabBookingEmail({
                        labEmail: labData.email || '',
                        labName: labData.full_name || 'Lab',
                        patientEmail: patData.email || '',
                        patientName: patData.full_name || 'Patient',
                        date: new Date(booking.appointmentDate).toLocaleDateString(),
                        time: booking.appointmentTime,
                        testName: testData?.test_name || 'Lab Test'
                    }).catch(console.error);
                } else {
                    console.warn(`Booking created but email skipped. Missing labData or patData.`);
                }
            } catch (notifyErr) {
                console.error("Booking notification failed during execution:", notifyErr);
            }

            return data;
        } catch (error) {
            console.error("Booking creation failed:", error);
            throw error;
        }
    },

    // Get bookings for a patient
    async getPatientBookings(patientId: string): Promise<Booking[]> {
        // Fetch appointments without complex joins to avoid FK errors
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('appointment_date', { ascending: false });

        if (apptError) throw apptError;
        if (!appointments || appointments.length === 0) return [];

        // Get unique test IDs and lab IDs
        const testIds = [...new Set(appointments.map(a => a.test_id).filter(Boolean))];
        const labIds = [...new Set(appointments.map(a => a.lab_id).filter(Boolean))];

        // Fetch tests
        const { data: tests } = await supabase
            .from('lab_tests')
            .select('test_id, test_name, price')
            .in('test_id', testIds);

        // Fetch labs (from labs table, not users)
        const { data: labs } = await supabase
            .from('labs')
            .select('lab_id, lab_name')
            .in('lab_id', labIds);

        // Fetch reports (optional - may not exist)
        const appointmentIds = appointments.map(a => a.appointment_id);
        let reports: any[] = [];
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('appointment_id, file_path, generated_at')
                .in('appointment_id', appointmentIds);
            if (!error && data) {
                reports = data;
            }
        } catch (e) {
            console.warn('Reports fetch failed, continuing without reports');
        }

        // Create lookup maps
        const testMap = new Map((tests || []).map((t: any) => [t.test_id, t]));
        const labMap = new Map((labs || []).map((l: any) => [l.lab_id, l]));
        const reportMap = new Map((reports || []).map((r: any) => [r.appointment_id, r]));

        // Map to frontend model
        return appointments.map((item: any) => {
            const test = testMap.get(item.test_id);
            const lab = labMap.get(item.lab_id);
            const report = reportMap.get(item.appointment_id);

            return {
                id: item.appointment_id,
                patientId: item.patient_id,
                patientName: '',
                testId: item.test_id,
                testName: test?.test_name || 'Unknown Test',
                labId: item.lab_id,
                labName: lab?.lab_name || 'Unknown Lab',
                status: item.status,
                collectionType: item.collection_type === 'LAB' ? 'lab-visit' : 'home',
                appointmentDate: item.appointment_date,
                appointmentTime: item.time_slot,
                price: test?.price,
                bookedAt: item.created_at,
                reportUrl: report?.file_path ? 'has-report' : undefined,
                completedAt: report?.generated_at
            };
        });
    },

    // Get bookings for a lab
    async getLabBookings(labId: string) {
        // Fetch appointments without complex joins
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('lab_id', labId)
            .order('appointment_date', { ascending: true });

        if (apptError) throw apptError;
        if (!appointments || appointments.length === 0) return [];

        // Get unique patient IDs and test IDs
        const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
        const testIds = [...new Set(appointments.map(a => a.test_id).filter(Boolean))];

        // Fetch patients from users table
        const { data: patients } = await supabase
            .from('users')
            .select('user_id, full_name, mobile, status')
            .in('user_id', patientIds);

        // Fetch tests
        const { data: tests } = await supabase
            .from('lab_tests')
            .select('test_id, test_name')
            .in('test_id', testIds);

        // Create lookup maps
        const patientMap = new Map((patients || []).map((p: any) => [p.user_id, p]));
        const testMap = new Map((tests || []).map((t: any) => [t.test_id, t]));

        return appointments.map((item: any) => {
            const patient = patientMap.get(item.patient_id);
            const test = testMap.get(item.test_id);

            return {
                id: item.appointment_id,
                patientId: item.patient_id,
                patientName: patient?.full_name || 'Unknown',
                patientPhone: patient?.mobile,
                testId: item.test_id,
                testName: test?.test_name || 'Unknown Test',
                status: item.status?.toLowerCase(),
                collectionType: item.collection_type?.toLowerCase(),
                appointmentDate: item.appointment_date,
                appointmentTime: item.time_slot,
                address: item.address
            };
        });
    },

    // Update booking status
    async updateStatus(bookingId: string, status: string) {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status: status.toUpperCase() })
            .eq('appointment_id', bookingId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get report values for an appointment
    async getReportValues(appointmentId: string) {
        try {
            // Fetch report values with test parameters
            const { data: reportValues, error: rvError } = await supabase
                .from('report_values')
                .select('*')
                .eq('appointment_id', appointmentId);

            if (rvError || !reportValues || reportValues.length === 0) {
                console.warn('No report values found for appointment:', appointmentId);
                return [];
            }

            // Get parameter IDs
            const paramIds = reportValues.map(rv => rv.parameter_id).filter(Boolean);

            // Fetch test parameters
            const { data: params } = await supabase
                .from('test_parameters')
                .select('id, parameter_name, unit, normal_min, normal_max, data_type')
                .in('id', paramIds);

            const paramMap = new Map((params || []).map((p: any) => [p.id, p]));

            // Map to frontend format
            return reportValues.map((rv: any) => {
                const param = paramMap.get(rv.parameter_id);
                const isAbnormal = rv.is_abnormal;

                let status: 'normal' | 'high' | 'low' | 'critical' = 'normal';
                if (isAbnormal && param?.data_type === 'NUMERIC') {
                    const value = parseFloat(rv.value);
                    if (value < param.normal_min) status = 'low';
                    else if (value > param.normal_max) status = 'high';
                }

                return {
                    name: param?.parameter_name || 'Unknown',
                    value: rv.value,
                    unit: param?.unit || '',
                    referenceRange: param?.normal_min && param?.normal_max
                        ? `${param.normal_min} - ${param.normal_max}`
                        : '-',
                    status: status
                };
            });
        } catch (error) {
            console.error('Failed to fetch report values:', error);
            return [];
        }
    },

    // Get report file URL (signed URL from backend)
    // Get report file URL (signed URL directly from Supabase)
    async getReportUrl(appointmentId: string) {
        try {
            // 1. Get file path from reports table
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .select('file_path')
                .eq('appointment_id', appointmentId)
                .single();

            if (reportError || !report) {
                console.error('Report not found for appointment:', appointmentId);
                return null;
            }

            // 2. Generate signed URL
            const { data, error } = await supabase.storage
                .from('reports')
                .createSignedUrl(report.file_path, 3600); // Valid for 1 hour

            if (error) {
                console.error('Error creating signed URL:', error);
                return null;
            }

            return data.signedUrl;
        } catch (error) {
            console.error('Error fetching report URL:', error);
            return null;
        }
    }
};

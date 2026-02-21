
import { supabase } from '@/lib/supabase';
import { sendBookingStatusEmail } from '@/services/emailService';

export const labService = {
    // Get Lab Dashboard Stats
    async getStats(labId: string) {
        // Total Bookings
        const { count: totalBookings } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('lab_id', labId);

        // Pending Bookings
        const { count: pendingBookings } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('lab_id', labId)
            .eq('status', 'BOOKED');

        // Completed Tests
        const { count: completedTests } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('lab_id', labId)
            .eq('status', 'REPORT_READY');

        // Total Revenue
        const { data: revenueData } = await supabase
            .from('appointments')
            .select(`
                test_id,
                test:lab_tests(price)
            `)
            .eq('lab_id', labId)
            .eq('status', 'REPORT_READY');

        const totalRevenue = revenueData?.reduce((acc, curr: any) => acc + (curr.test?.price || 0), 0) || 0;

        return {
            totalBookings: totalBookings || 0,
            pendingBookings: pendingBookings || 0,
            completedTests: completedTests || 0,
            totalRevenue
        };
    },

    // --- Test Management ---

    async getTests() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('lab_tests')
            .select('*')
            .eq('lab_id', user.id) // Filter by own tests
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createTest(testData: any) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('lab_tests')
            .insert([{ ...testData, lab_id: user.id }]) // Inject lab_id
            .select()
            .single();

        if (error) throw error;

        // Auto-seed parameters
        try {
            const testNameLower = testData.test_name.toLowerCase();
            const DEFAULT_TEST_PARAMETERS: Record<string, any[]> = {
                'cbc': [
                    { parameter_name: 'Hemoglobin (Hb)', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 25, normal_min: 13.5, normal_max: 17.5, display_order: 1 },
                    { parameter_name: 'Total RBC Count', unit: 'million/µL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 4.5, normal_max: 5.9, display_order: 2 },
                    { parameter_name: 'WBC Count', unit: '/µL', data_type: 'NUMERIC', min_value: 0, max_value: 50000, normal_min: 4500, normal_max: 11000, display_order: 3 },
                    { parameter_name: 'Platelet Count', unit: '/µL', data_type: 'NUMERIC', min_value: 0, max_value: 1000000, normal_min: 150000, normal_max: 450000, display_order: 4 },
                    { parameter_name: 'PCV / Hematocrit', unit: '%', data_type: 'NUMERIC', min_value: 0, max_value: 100, normal_min: 41, normal_max: 50, display_order: 5 },
                ],
                'hemogram': [
                    { parameter_name: 'Hemoglobin (Hb)', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 25, normal_min: 13.5, normal_max: 17.5, display_order: 1 },
                    { parameter_name: 'Total RBC Count', unit: 'million/µL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 4.5, normal_max: 5.9, display_order: 2 },
                    { parameter_name: 'WBC Count', unit: '/µL', data_type: 'NUMERIC', min_value: 0, max_value: 50000, normal_min: 4500, normal_max: 11000, display_order: 3 },
                    { parameter_name: 'Platelet Count', unit: '/µL', data_type: 'NUMERIC', min_value: 0, max_value: 1000000, normal_min: 150000, normal_max: 450000, display_order: 4 },
                    { parameter_name: 'PCV / Hematocrit', unit: '%', data_type: 'NUMERIC', min_value: 0, max_value: 100, normal_min: 41, normal_max: 50, display_order: 5 },
                ],
                'thyroid': [
                    { parameter_name: 'Total T3', unit: 'ng/dL', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 80, normal_max: 200, display_order: 1 },
                    { parameter_name: 'Total T4', unit: 'µg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 25, normal_min: 5.1, normal_max: 14.1, display_order: 2 },
                    { parameter_name: 'TSH', unit: 'µIU/mL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 0.4, normal_max: 4.0, display_order: 3 },
                ],
                'lipid': [
                    { parameter_name: 'Total Cholesterol', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 125, normal_max: 200, display_order: 1 },
                    { parameter_name: 'Triglycerides', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 1000, normal_min: 0, normal_max: 150, display_order: 2 },
                    { parameter_name: 'HDL Cholesterol', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 100, normal_min: 40, normal_max: 60, display_order: 3 },
                    { parameter_name: 'LDL Cholesterol', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 300, normal_min: 0, normal_max: 100, display_order: 4 },
                    { parameter_name: 'VLDL', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 100, normal_min: 2, normal_max: 30, display_order: 5 },
                ],
                'liver': [
                    { parameter_name: 'Total Bilirubin', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 0.1, normal_max: 1.2, display_order: 1 },
                    { parameter_name: 'Direct Bilirubin', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 0, normal_max: 0.3, display_order: 2 },
                    { parameter_name: 'SGOT (AST)', unit: 'U/L', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 5, normal_max: 40, display_order: 3 },
                    { parameter_name: 'SGPT (ALT)', unit: 'U/L', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 7, normal_max: 56, display_order: 4 },
                    { parameter_name: 'Alkaline Phosphatase', unit: 'U/L', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 44, normal_max: 147, display_order: 5 },
                    { parameter_name: 'Total Protein', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 15, normal_min: 6.0, normal_max: 8.3, display_order: 6 },
                    { parameter_name: 'Albumin', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 3.5, normal_max: 5.5, display_order: 7 },
                ],
                'lft': [
                    { parameter_name: 'Total Bilirubin', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 0.1, normal_max: 1.2, display_order: 1 },
                    { parameter_name: 'Direct Bilirubin', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 0, normal_max: 0.3, display_order: 2 },
                    { parameter_name: 'SGOT (AST)', unit: 'U/L', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 5, normal_max: 40, display_order: 3 },
                    { parameter_name: 'SGPT (ALT)', unit: 'U/L', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 7, normal_max: 56, display_order: 4 },
                    { parameter_name: 'Alkaline Phosphatase', unit: 'U/L', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 44, normal_max: 147, display_order: 5 },
                    { parameter_name: 'Total Protein', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 15, normal_min: 6.0, normal_max: 8.3, display_order: 6 },
                    { parameter_name: 'Albumin', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 3.5, normal_max: 5.5, display_order: 7 },
                ],
                'kidney': [
                    { parameter_name: 'Blood Urea', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 200, normal_min: 15, normal_max: 45, display_order: 1 },
                    { parameter_name: 'Serum Creatinine', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 0.6, normal_max: 1.2, display_order: 2 },
                    { parameter_name: 'Uric Acid', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 3.5, normal_max: 7.2, display_order: 3 },
                    { parameter_name: 'Sodium', unit: 'mEq/L', data_type: 'NUMERIC', min_value: 100, max_value: 200, normal_min: 135, normal_max: 145, display_order: 4 },
                    { parameter_name: 'Potassium', unit: 'mEq/L', data_type: 'NUMERIC', min_value: 1, max_value: 10, normal_min: 3.5, normal_max: 5.1, display_order: 5 },
                ],
                'kft': [
                    { parameter_name: 'Blood Urea', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 200, normal_min: 15, normal_max: 45, display_order: 1 },
                    { parameter_name: 'Serum Creatinine', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 0.6, normal_max: 1.2, display_order: 2 },
                    { parameter_name: 'Uric Acid', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 3.5, normal_max: 7.2, display_order: 3 },
                    { parameter_name: 'Sodium', unit: 'mEq/L', data_type: 'NUMERIC', min_value: 100, max_value: 200, normal_min: 135, normal_max: 145, display_order: 4 },
                    { parameter_name: 'Potassium', unit: 'mEq/L', data_type: 'NUMERIC', min_value: 1, max_value: 10, normal_min: 3.5, normal_max: 5.1, display_order: 5 },
                ],
                'vitamin d': [
                    { parameter_name: '25-OH Vitamin D', unit: 'ng/mL', data_type: 'NUMERIC', min_value: 0, max_value: 200, normal_min: 30, normal_max: 100, display_order: 1 },
                ],
                'hba1c': [
                    { parameter_name: 'HbA1c', unit: '%', data_type: 'NUMERIC', min_value: 0, max_value: 20, normal_min: 4.0, normal_max: 5.6, display_order: 1 },
                    { parameter_name: 'Estimated Average Glucose', unit: 'mg/dL', data_type: 'NUMERIC', min_value: 0, max_value: 500, normal_min: 90, normal_max: 120, display_order: 2 },
                ],
                'urine': [
                    { parameter_name: 'Color', unit: '', data_type: 'TEXT', text_options: ['Pale Yellow', 'Yellow', 'Dark Yellow', 'Reddish'], display_order: 1 },
                    { parameter_name: 'Appearance', unit: '', data_type: 'TEXT', text_options: ['Clear', 'Hazy', 'Cloudy'], display_order: 2 },
                    { parameter_name: 'Glucouse', unit: '', data_type: 'TEXT', text_options: ['Negative', 'Trace', '1+', '2+', '3+'], display_order: 3 },
                    { parameter_name: 'Protein', unit: '', data_type: 'TEXT', text_options: ['Negative', 'Trace', '1+', '2+'], display_order: 4 },
                ],
                'blood': [
                    { parameter_name: 'Hemoglobin', unit: 'g/dL', data_type: 'NUMERIC', min_value: 0, max_value: 25, normal_min: 12, normal_max: 16, display_order: 1 },
                    { parameter_name: 'RBC Count', unit: 'million/µL', data_type: 'NUMERIC', min_value: 0, max_value: 10, normal_min: 4, normal_max: 6, display_order: 2 },
                    { parameter_name: 'WBC Count', unit: '/µL', data_type: 'NUMERIC', min_value: 0, max_value: 50000, normal_min: 4000, normal_max: 11000, display_order: 3 },
                ]
            };

            let matchedParams = null;
            for (const [key, params] of Object.entries(DEFAULT_TEST_PARAMETERS)) {
                if (testNameLower.includes(key)) {
                    matchedParams = params;
                    break;
                }
            }

            if (matchedParams) {
                console.log(`Auto-seeding parameters for ${testData.test_name} (matched '${testNameLower}')`);
                const paramsToInsert = matchedParams.map(p => ({
                    ...p,
                    test_id: data.test_id
                }));
                const { error: seedError } = await supabase.from('test_parameters').insert(paramsToInsert);
                if (seedError) console.error("Auto-seed failed:", seedError);
            }
        } catch (err) {
            console.error("Auto-seed exception:", err);
            // Don't fail the creation if seeding fails, just log it
        }

        return data;
    },

    async updateTest(id: string, updates: any) {
        const { error } = await supabase
            .from('lab_tests')
            .update(updates)
            .eq('test_id', id);

        if (error) throw error;
    },

    async deleteTest(id: string) {
        const { error } = await supabase
            .from('lab_tests')
            .delete()
            .eq('test_id', id);

        if (error) throw error;
    },

    // --- Booking Management ---

    async getBookings(labId: string) {
        // Fetch appointments without complex joins to avoid FK errors
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('lab_id', labId)
            .order('created_at', { ascending: false });

        if (apptError) throw apptError;
        if (!appointments) return [];

        // Manual join for tests, patients, and technicians
        // Using correct schema: users table (not user_profiles), lab_tests with test_name
        const testIds = [...new Set(appointments.map(a => a.test_id).filter(Boolean))];
        const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
        const technicianIds = [...new Set(appointments.map(a => a.assigned_technician_id).filter(Boolean))];

        // Query lab_tests with correct column names (test_name, not name)
        const { data: tests } = testIds.length > 0
            ? await supabase.from('lab_tests').select('test_id, test_name, price').in('test_id', testIds)
            : { data: [] };

        // Query users table (not user_profiles) with correct columns (full_name, mobile)
        const { data: patients } = patientIds.length > 0
            ? await supabase.from('users').select('user_id, full_name, mobile').in('user_id', patientIds)
            : { data: [] };

        const { data: technicians } = technicianIds.length > 0
            ? await supabase.from('users').select('user_id, full_name, mobile').in('user_id', technicianIds)
            : { data: [] };

        return appointments.map(app => {
            const test = tests?.find(t => t.test_id === app.test_id);
            const patient = patients?.find(p => p.user_id === app.patient_id);
            const technician = technicians?.find(t => t.user_id === app.assigned_technician_id);

            return {
                id: app.appointment_id || app.id,
                patientId: app.patient_id,
                patientName: patient?.full_name || 'Unknown',
                patientMobile: patient?.mobile || 'N/A',
                testId: app.test_id,
                testName: test?.test_name || 'Unknown',
                amount: test?.price || 0,
                labId: app.lab_id,
                labName: 'My Lab',
                status: app.status,
                type: app.collection_type,
                collectionType: app.collection_type,
                date: app.appointment_date,
                timeSlot: app.time_slot || app.appointment_time,
                appointmentDate: app.appointment_date,
                appointmentTime: app.time_slot || app.appointment_time,
                bookedAt: app.created_at,
                reportUrl: app.report_url,
                address: app.address,
                // Technician fields
                assignedTechnicianId: app.assigned_technician_id,
                technicianName: technician?.full_name,
                technicianPhone: technician?.mobile
            };
        });
    },

    async updateBookingStatusAndNotify(id: string, status: string) {
        // 1. Update Database
        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('appointment_id', id);

        if (error) throw error;

        // 2. Send Email Notification via EmailJS (Fire and Forget)
        try {
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('patient_id, test_id')
                .eq('appointment_id', id)
                .maybeSingle();

            if (apptError) {
                console.error("Error fetching appointment for email:", apptError);
                return;
            }

            if (apptData?.patient_id) {
                const { data: patient, error: patientError } = await supabase
                    .from('users')
                    .select('full_name, email')
                    .eq('user_id', apptData.patient_id)
                    .maybeSingle();

                if (patientError) console.error("Error fetching patient for email:", patientError);

                let testName = 'Lab Test';
                if (apptData.test_id) {
                    const { data: test, error: testError } = await supabase
                        .from('lab_tests')
                        .select('test_name')
                        .eq('test_id', apptData.test_id)
                        .maybeSingle();
                    if (testError) console.error("Error fetching test for email:", testError);
                    if (test?.test_name) testName = test.test_name;
                }

                if (patient?.email) {
                    console.log(`Sending status update email to ${patient.email} for status ${status}`);
                    sendBookingStatusEmail({
                        patientEmail: patient.email,
                        patientName: patient.full_name || 'Patient',
                        bookingId: id,
                        status: status.toUpperCase(),
                        testName: testName,
                    }).then(() => console.log('Mail sent successfully'))
                        .catch(err => console.error('EmailJS notification failed:', err));
                } else {
                    console.warn(`Email not sent: No valid email found for patient_id ${apptData.patient_id}`);
                }
            } else {
                console.warn(`Email not sent: No patient_id found for appointment ${id}`);
            }
        } catch (e) {
            console.error('Failed to send email notification during execution', e);
        }
    },

    // Alias for TechnicianDashboard compatibility
    async updateStatus(id: string, status: string) {
        return this.updateBookingStatusAndNotify(id, status);
    },

    async assignTechnician(bookingId: string, technicianId: string) {
        // 1. Update Appointment
        const { error } = await supabase
            .from('appointments')
            .update({
                assigned_technician_id: technicianId,
                status: 'TECH_ASSIGNED'
            })
            .eq('appointment_id', bookingId);

        if (error) throw error;

        // 2. Notify via EmailJS (Fire and Forget)
        try {
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('patient_id, test_id')
                .eq('appointment_id', bookingId)
                .maybeSingle();

            if (apptError) {
                console.error("Error fetching appointment for tech assign email:", apptError);
                return;
            }

            if (apptData?.patient_id) {
                const { data: patient, error: patientError } = await supabase
                    .from('users')
                    .select('full_name, email')
                    .eq('user_id', apptData.patient_id)
                    .maybeSingle();

                if (patientError) console.error("Error fetching patient for tech assign email:", patientError);

                let testName = 'Lab Test';
                if (apptData.test_id) {
                    const { data: test, error: testError } = await supabase
                        .from('lab_tests')
                        .select('test_name')
                        .eq('test_id', apptData.test_id)
                        .maybeSingle();
                    if (testError) console.error("Error fetching test for tech assign email:", testError);
                    if (test?.test_name) testName = test.test_name;
                }

                if (patient?.email) {
                    console.log(`Sending tech assignment email to ${patient.email}`);
                    sendBookingStatusEmail({
                        patientEmail: patient.email,
                        patientName: patient.full_name || 'Patient',
                        bookingId,
                        status: 'TECH_ASSIGNED',
                        testName: testName,
                    }).then(() => console.log('Mail sent successfully for tech assignment'))
                        .catch(err => console.error('EmailJS Tech assignment notification failed:', err));
                } else {
                    console.warn(`Email not sent: No valid email found for patient_id ${apptData.patient_id}`);
                }
            } else {
                console.warn(`Email not sent: No patient_id found for appointment ${bookingId}`);
            }
        } catch (e) {
            console.error('Failed to send assignment notification during execution', e);
        }
    },

    // --- Technician Management ---

    async getTechnicians() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Note: lab_id is the same as user.id (1:1 relationship)
        const labId = user.id;

        // Get technicians for this lab directly
        const { data: technicianRecords, error: techError } = await supabase
            .from('technicians')
            .select('technician_id, is_active, created_at')
            .eq('lab_id', labId);

        if (techError) {
            console.error("Error fetching technicians:", techError);
            throw techError;
        }

        if (!technicianRecords || technicianRecords.length === 0) return [];

        // Fetch user details for each technician
        const technicianIds = technicianRecords.map(t => t.technician_id);
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .in('user_id', technicianIds);

        if (userError) throw userError;

        // Fetch Active Tasks Count
        // We select appointments where assigned_technician_id is in our list AND status is TECH_ASSIGNED
        const { data: activeTasks, error: taskError } = await supabase
            .from('appointments')
            .select('assigned_technician_id')
            .in('assigned_technician_id', technicianIds)
            .eq('status', 'TECH_ASSIGNED');

        if (taskError) console.error("Error checking active tasks", taskError);

        // Merge data
        return technicianRecords.map(tech => {
            const userDetails = users?.find(u => u.user_id === tech.technician_id);
            const activeCount = activeTasks?.filter(t => t.assigned_technician_id === tech.technician_id).length || 0;

            return {
                id: tech.technician_id,
                name: userDetails?.full_name || 'Unknown',
                email: userDetails?.email || '',
                phone: userDetails?.mobile || '',
                isActive: tech.is_active,
                joinedAt: tech.created_at,
                isBusy: activeCount > 0 // New Flag
            };
        });
    },



    async createTechnician(data: any) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        // lab_id is the user's ID
        const labId = session.user.id;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/technicians/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Optional: Pass session token if backend verifies it (currently backend uses service role)
            },
            body: JSON.stringify({
                ...data,
                labId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to create technician");
        }

        return result;
    },

    async activateTechnician(technicianId: string, isActive: boolean) {
        const { error } = await supabase
            .from('technicians')
            .update({ is_active: isActive })
            .eq('technician_id', technicianId);

        if (error) throw error;
    },

    // Start automated testing - generates results, PDF, and updates status
    async startTesting(appointmentId: string) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const response = await fetch(`${API_URL}/api/reports/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate report');
        }

        return await response.json();
    },

    // Get signed URL for report download
    async getReportDownloadUrl(appointmentId: string) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const response = await fetch(`${API_URL}/api/reports/${appointmentId}/download`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get download link');
        }

        const data = await response.json();
        return data.downloadUrl;
    },

    // --- Public Lab Access ---

    async getLabs() {
        const { data, error } = await supabase
            .from('labs')
            .select('*');

        if (error) throw error;
        return data;
    },

    // --- Slot Management ---

    async getSlots(labId: string, testId: string, date: string) {
        const { data, error } = await supabase
            .from('lab_test_slots')
            .select('*')
            .eq('lab_id', labId)
            .eq('test_id', testId)
            .eq('slot_date', date)
            .order('time_slot', { ascending: true });

        if (error) throw error;
        return data;
    },

    async addSlot(slotData: any) {
        const { data, error } = await supabase
            .from('lab_test_slots')
            .insert([slotData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteSlot(slotId: string) {
        const { error } = await supabase
            .from('lab_test_slots')
            .delete()
            .eq('slot_id', slotId);

        if (error) throw error;
    },
    async getAvailableSlots(labId: string, testId: string, date: string) {
        const { data, error } = await supabase
            .rpc('get_available_slots', { p_lab_id: labId, p_test_id: testId, p_date: date });

        if (error) throw error;
        // Cast the return type to include is_available boolean
        return data as { slot_id: string; time_slot: string; is_available: boolean }[];
    },

    // --- Profile Management ---

    async getLabProfile(userId: string) {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .eq('lab_id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateLabProfile(userId: string, updates: any) {
        const { error } = await supabase
            .from('labs')
            .update(updates)
            .eq('lab_id', userId);

        if (error) throw error;
    }
};

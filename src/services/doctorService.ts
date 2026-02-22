import { supabase } from '@/lib/supabase';
import { sendAppointmentRequestEmail } from '@/services/emailService';
import type {
    DoctorSlot, DoctorAppointment, DoctorNote,
    DoctorProfile, ConsultationType
} from '@/types';

export const doctorService = {
    // ==========================================
    // DOCTOR PROFILES
    // ==========================================

    async getDoctors(): Promise<DoctorProfile[]> {
        // Get all approved doctors
        const { data: users, error } = await supabase
            .from('users')
            .select('user_id, full_name, mobile, role, status')
            .eq('role', 'DOCTOR')
            .eq('status', 'ACTIVE');

        if (error) throw error;
        if (!users || users.length === 0) return [];

        const doctorIds = users.map(u => u.user_id);

        // Get doctor details (specialization, etc.)
        const { data: doctorDetails } = await supabase
            .from('doctors')
            .select('doctor_id, specialization, medical_registration_no, consultation_fee, experience_years, qualification, bio, working_hospital, profile_img')
            .in('doctor_id', doctorIds);

        return users.map(u => {
            const detail = doctorDetails?.find(d => d.doctor_id === u.user_id);
            return {
                id: u.user_id,
                name: u.full_name,
                email: '',
                mobile: u.mobile,
                specialization: detail?.specialization || 'General',
                medicalRegNo: detail?.medical_registration_no,
                consultationFee: detail?.consultation_fee || 500,
                status: u.status,
                experienceYears: detail?.experience_years || 0,
                qualification: detail?.qualification || '',
                bio: detail?.bio || '',
                workingHospital: detail?.working_hospital || '',
                profileImg: detail?.profile_img || ''
            };
        });
    },

    async getDoctorProfile(doctorId: string): Promise<DoctorProfile | null> {
        const { data: user, error } = await supabase
            .from('users')
            .select('user_id, full_name, mobile')
            .eq('user_id', doctorId)
            .single();

        if (error || !user) return null;

        const { data: detail } = await supabase
            .from('doctors')
            .select('specialization, medical_registration_no, consultation_fee, experience_years, qualification, bio, working_hospital, profile_img')
            .eq('doctor_id', doctorId)
            .single();

        return {
            id: user.user_id,
            name: user.full_name,
            email: '',
            mobile: user.mobile,
            specialization: detail?.specialization || 'General',
            medicalRegNo: detail?.medical_registration_no,
            consultationFee: detail?.consultation_fee || 500
        };
    },

    // ==========================================
    // SLOTS MANAGEMENT (Doctor Side)
    // ==========================================

    async createSlot(slot: {
        doctorId: string;
        slotDate: string;
        startTime: string;
        endTime: string;
        consultationType: ConsultationType;
    }) {
        const { data, error } = await supabase
            .from('doctor_time_slots')
            .insert({
                doctor_id: slot.doctorId,
                slot_date: slot.slotDate,
                start_time: slot.startTime,
                end_time: slot.endTime,
                consultation_type: slot.consultationType,
                is_booked: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getSlots(doctorId: string, fromDate?: string): Promise<DoctorSlot[]> {
        let query = supabase
            .from('doctor_time_slots')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('slot_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (fromDate) {
            query = query.gte('slot_date', fromDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(s => ({
            slotId: s.slot_id,
            doctorId: s.doctor_id,
            slotDate: s.slot_date,
            startTime: s.start_time,
            endTime: s.end_time,
            isBooked: s.is_booked,
            consultationType: s.consultation_type
        }));
    },

    async getAvailableSlots(doctorId: string, consultationType?: ConsultationType): Promise<DoctorSlot[]> {
        const today = new Date().toISOString().split('T')[0];
        let query = supabase
            .from('doctor_time_slots')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('is_booked', false)
            .gte('slot_date', today)
            .order('slot_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (consultationType) {
            query = query.eq('consultation_type', consultationType);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(s => ({
            slotId: s.slot_id,
            doctorId: s.doctor_id,
            slotDate: s.slot_date,
            startTime: s.start_time,
            endTime: s.end_time,
            isBooked: s.is_booked,
            consultationType: s.consultation_type
        }));
    },

    async deleteSlot(slotId: string) {
        const { error } = await supabase
            .from('doctor_time_slots')
            .delete()
            .eq('slot_id', slotId)
            .eq('is_booked', false); // Can only delete un-booked slots

        if (error) throw error;
    },

    // ==========================================
    // APPOINTMENT BOOKING (Patient Side)
    // ==========================================

    async requestAppointment(params: {
        patientId: string;
        doctorId: string;
        slotId: string;
        consultationType: ConsultationType;
    }): Promise<{ appointment: any }> {
        // 1. Create appointment in pending_approval state
        const { data: appointment, error: apptError } = await supabase
            .from('doctor_appointments')
            .insert({
                patient_id: params.patientId,
                doctor_id: params.doctorId,
                slot_id: params.slotId,
                consultation_type: params.consultationType,
                status: 'pending_approval',
                payment_status: 'pending'
            })
            .select()
            .single();

        if (apptError) throw apptError;

        // 2. Mark slot as booked so others can't request the same exactly
        await supabase
            .from('doctor_time_slots')
            .update({ is_booked: true })
            .eq('slot_id', params.slotId);

        // 3. Notify Doctor via EmailJS
        try {
            const { data: docData } = await supabase.from('users').select('full_name, email').eq('user_id', params.doctorId).single();
            const { data: patData } = await supabase.from('users').select('full_name').eq('user_id', params.patientId).single();
            const { data: slotData } = await supabase.from('doctor_time_slots').select('slot_date, start_time, end_time').eq('slot_id', params.slotId).single();

            if (docData?.email && patData) {
                const dateStr = slotData?.slot_date ? new Date(slotData.slot_date).toLocaleDateString() : 'N/A';
                const timeStr = `${slotData?.start_time || ''} - ${slotData?.end_time || ''}`;

                sendAppointmentRequestEmail({
                    doctorEmail: docData.email,
                    doctorName: docData.full_name || 'Doctor',
                    patientName: patData.full_name || 'Patient',
                    date: dateStr,
                    time: timeStr,
                    consultationType: params.consultationType
                }).catch(console.error);
            }
        } catch (e) {
            console.error("Failed to notify doctor", e);
        }

        return { appointment };
    },

    async approveAppointment(appointmentId: string): Promise<void> {
        const { error } = await supabase
            .from('doctor_appointments')
            .update({ status: 'payment_pending' })
            .eq('appointment_id', appointmentId)
            .eq('status', 'pending_approval');

        if (error) throw error;
    },

    async rejectAppointment(appointmentId: string): Promise<void> {
        // 1. Get the appointment to find the slot
        const { data: appt, error: fetchErr } = await supabase
            .from('doctor_appointments')
            .select('slot_id')
            .eq('appointment_id', appointmentId)
            .single();

        if (fetchErr || !appt) throw fetchErr || new Error('Appt not found');

        // 2. Update status to rejected
        const { error: updateErr } = await supabase
            .from('doctor_appointments')
            .update({ status: 'rejected' })
            .eq('appointment_id', appointmentId);

        if (updateErr) throw updateErr;

        // 3. Free up the slot again
        if (appt.slot_id) {
            await supabase
                .from('doctor_time_slots')
                .update({ is_booked: false })
                .eq('slot_id', appt.slot_id);
        }
    },

    async processPayment(params: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        amount: number;
        consultationType: ConsultationType;
    }): Promise<{ appointment: any; payment: any }> {
        // Generate secure tokens
        const meetingRoomId = null;
        const secureSessionToken = crypto.randomUUID();

        // 1. Update appointment to scheduled
        const { data: appointment, error: apptError } = await supabase
            .from('doctor_appointments')
            .update({
                status: 'scheduled',
                payment_status: 'paid',
                meeting_room_id: meetingRoomId,
                secure_session_token: secureSessionToken
            })
            .eq('appointment_id', params.appointmentId)
            .eq('status', 'payment_pending')
            .select()
            .single();

        if (apptError) throw apptError;

        // 2. Create payment record
        const { data: payment, error: payError } = await supabase
            .from('doctor_payments')
            .insert({
                appointment_id: params.appointmentId,
                patient_id: params.patientId,
                doctor_id: params.doctorId,
                amount: params.amount,
                status: 'paid'
            })
            .select()
            .single();

        if (payError) throw payError;

        return { appointment, payment };
    },

    // ==========================================
    // APPOINTMENT MANAGEMENT
    // ==========================================

    async getDoctorAppointments(doctorId: string): Promise<DoctorAppointment[]> {
        const { data: appointments, error } = await supabase
            .from('doctor_appointments')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!appointments) return [];

        // Fetch related data
        const patientIds = [...new Set(appointments.map(a => a.patient_id))];
        const slotIds = [...new Set(appointments.map(a => a.slot_id).filter(Boolean))];

        const { data: patients } = patientIds.length > 0
            ? await supabase.from('users').select('user_id, full_name, mobile, email').in('user_id', patientIds)
            : { data: [] };

        const { data: slots } = slotIds.length > 0
            ? await supabase.from('doctor_time_slots').select('slot_id, slot_date, start_time, end_time').in('slot_id', slotIds)
            : { data: [] };

        return appointments.map(a => {
            const patient = patients?.find(p => p.user_id === a.patient_id);
            const slot = slots?.find(s => s.slot_id === a.slot_id);
            return {
                appointmentId: a.appointment_id,
                patientId: a.patient_id,
                patientName: patient?.full_name || 'Unknown',
                patientEmail: patient?.email,
                patientMobile: patient?.mobile,
                doctorId: a.doctor_id,
                slotId: a.slot_id,
                consultationType: a.consultation_type,
                status: a.status,
                paymentStatus: a.payment_status,
                meetingRoomId: a.meeting_room_id,
                meetingStarted: a.meeting_started,
                secureSessionToken: a.secure_session_token,
                slotDate: slot?.slot_date,
                startTime: slot?.start_time,
                endTime: slot?.end_time,
                createdAt: a.created_at
            };
        });
    },

    async getPatientAppointments(patientId: string): Promise<DoctorAppointment[]> {
        const { data: appointments, error } = await supabase
            .from('doctor_appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!appointments) return [];

        const doctorIds = [...new Set(appointments.map(a => a.doctor_id))];
        const slotIds = [...new Set(appointments.map(a => a.slot_id).filter(Boolean))];

        const { data: doctors } = doctorIds.length > 0
            ? await supabase.from('users').select('user_id, full_name, mobile').in('user_id', doctorIds)
            : { data: [] };

        const { data: doctorDetails } = doctorIds.length > 0
            ? await supabase.from('doctors').select('doctor_id, specialization').in('doctor_id', doctorIds)
            : { data: [] };

        const { data: slots } = slotIds.length > 0
            ? await supabase.from('doctor_time_slots').select('slot_id, slot_date, start_time, end_time').in('slot_id', slotIds)
            : { data: [] };

        return appointments.map(a => {
            const doctor = doctors?.find(d => d.user_id === a.doctor_id);
            const detail = doctorDetails?.find(d => d.doctor_id === a.doctor_id);
            const slot = slots?.find(s => s.slot_id === a.slot_id);
            return {
                appointmentId: a.appointment_id,
                patientId: a.patient_id,
                doctorId: a.doctor_id,
                doctorName: doctor?.full_name || 'Unknown',
                doctorSpecialization: detail?.specialization || 'General',
                slotId: a.slot_id,
                consultationType: a.consultation_type,
                status: a.status,
                paymentStatus: a.payment_status,
                meetingRoomId: a.meeting_room_id,
                meetingStarted: a.meeting_started,
                secureSessionToken: a.secure_session_token,
                slotDate: slot?.slot_date,
                startTime: slot?.start_time,
                endTime: slot?.end_time,
                createdAt: a.created_at
            };
        });
    },

    // ==========================================
    // STATE TRANSITIONS (Protected)
    // ==========================================

    async updateAppointmentStatus(appointmentId: string, newStatus: string, userId: string) {
        // 1. Fetch current appointment
        const { data: appt, error: fetchErr } = await supabase
            .from('doctor_appointments')
            .select('status, doctor_id, patient_id')
            .eq('appointment_id', appointmentId)
            .single();

        if (fetchErr || !appt) throw new Error('Appointment not found');

        // 2. Validate user role
        const isDoctor = appt.doctor_id === userId;
        const isPatient = appt.patient_id === userId;
        if (!isDoctor && !isPatient) throw new Error('Unauthorized');

        // 3. Validate state transition
        const validTransitions: Record<string, string[]> = {
            'pending_approval': ['payment_pending', 'rejected'],
            'payment_pending': ['scheduled', 'cancelled'],
            'scheduled': ['ongoing', 'cancelled'],
            'ongoing': ['completed'],
            'completed': [],
            'cancelled': [],
            'rejected': []
        };

        const allowed = validTransitions[appt.status] || [];
        if (!allowed.includes(newStatus)) {
            throw new Error(`Invalid transition: ${appt.status} → ${newStatus}`);
        }

        // 4. Only doctor can mark ongoing/completed
        if ((newStatus === 'ongoing' || newStatus === 'completed') && !isDoctor) {
            throw new Error('Only the doctor can mark an appointment as ongoing or completed');
        }

        // 5. Update
        const updates: any = { status: newStatus };
        if (newStatus === 'ongoing') updates.meeting_started = true;

        const { error } = await supabase
            .from('doctor_appointments')
            .update(updates)
            .eq('appointment_id', appointmentId);

        if (error) throw error;
    },

    // ==========================================
    // VIDEO ROOM SECURITY
    // ==========================================

    async validateVideoAccess(appointmentId: string, userId: string, token: string): Promise<DoctorAppointment | null> {
        const { data: appt, error } = await supabase
            .from('doctor_appointments')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single();

        if (error || !appt) return null;

        // Check auth
        if (appt.patient_id !== userId && appt.doctor_id !== userId) return null;

        // Check token
        if (appt.secure_session_token !== token) return null;

        // Check consultation type
        if (appt.consultation_type !== 'video') return null;

        // Check status (must be scheduled or ongoing)
        if (!['scheduled', 'ongoing'].includes(appt.status)) return null;

        // Fetch slot for time info
        const { data: slot } = await supabase
            .from('doctor_time_slots')
            .select('slot_date, start_time, end_time')
            .eq('slot_id', appt.slot_id)
            .single();

        return {
            appointmentId: appt.appointment_id,
            patientId: appt.patient_id,
            doctorId: appt.doctor_id,
            slotId: appt.slot_id,
            consultationType: appt.consultation_type,
            status: appt.status,
            paymentStatus: appt.payment_status,
            meetingRoomId: appt.meeting_room_id,
            meetingStarted: appt.meeting_started,
            secureSessionToken: appt.secure_session_token,
            slotDate: slot?.slot_date,
            startTime: slot?.start_time,
            endTime: slot?.end_time,
            createdAt: appt.created_at
        };
    },

    // ==========================================
    // DOCTOR NOTES
    // ==========================================

    async addNote(params: {
        appointmentId: string;
        doctorId: string;
        patientId: string;
        note: string;
    }) {
        const { data, error } = await supabase
            .from('doctor_notes')
            .insert({
                doctor_appointment_id: params.appointmentId,
                doctor_id: params.doctorId,
                patient_id: params.patientId,
                note: params.note
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getNotes(appointmentId: string): Promise<DoctorNote[]> {
        const { data, error } = await supabase
            .from('doctor_notes')
            .select('*')
            .eq('doctor_appointment_id', appointmentId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(n => ({
            noteId: n.note_id,
            doctorAppointmentId: n.doctor_appointment_id,
            doctorId: n.doctor_id,
            patientId: n.patient_id,
            note: n.note,
            createdAt: n.created_at
        }));
    },

    // ==========================================
    // CONSULTATION REPORTS (Shared during call)
    // ==========================================

    async shareReport(appointmentId: string, reportId: string) {
        const { data, error } = await supabase
            .from('consultation_reports')
            .insert({
                doctor_appointment_id: appointmentId,
                report_id: reportId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getSharedReports(appointmentId: string) {
        const { data, error } = await supabase
            .from('consultation_reports')
            .select('*')
            .eq('doctor_appointment_id', appointmentId)
            .order('shared_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

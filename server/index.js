require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging
console.log('DEBUG - SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('DEBUG - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET (length: ' + supabaseServiceKey.length + ')' : 'NOT SET');

const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Admin Signup (Bypasses IP Rate Limits)
app.post('/api/auth/signup', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase not configured' });
        }

        const { email, password, fullName, mobile, role, ...roleData } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Create Auth User using Admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
                role: role || 'PATIENT'
            }
        });

        if (authError) {
            console.error('Supabase Admin Signup Error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // 2. Create User Profile
        const { error: userError } = await supabase
            .from('users')
            .insert({
                user_id: userId,
                email: email,
                full_name: fullName || 'User',
                mobile: mobile || null,
                role: role || 'PATIENT',
                status: (role === 'LAB' || role === 'DOCTOR') ? 'PENDING' : 'ACTIVE'
            });

        if (userError) {
            console.error('Error creating user profile:', userError);
            // Optional: Delete auth user if profile creation fails?
            return res.status(500).json({ error: 'Failed to create user profile' });
        }

        // 3. Create Role-Specific Record
        if (role === 'PATIENT') {
            await supabase.from('patients').insert({
                patient_id: userId,
                address: roleData.address || null,
                latitude: roleData.latitude || null,
                longitude: roleData.longitude || null
            });
        } else if (role === 'LAB') {
            await supabase.from('labs').insert({
                lab_id: userId,
                lab_name: roleData.labName || 'Lab',
                registration_number: roleData.registrationNumber,
                address: roleData.address,
                latitude: roleData.latitude || null,
                longitude: roleData.longitude || null
            });
        } else if (role === 'DOCTOR') {
            await supabase.from('doctors').insert({
                doctor_id: userId,
                specialization: roleData.specialization,
                medical_registration_no: roleData.medicalRegNo,
                consultation_fee: roleData.consultationFee || 500,
                experience_years: roleData.experienceYears || 0,
                qualification: roleData.qualification || null,
                bio: roleData.bio || null,
                working_hospital: roleData.workingHospital || null,
                profile_img: roleData.profileImg || null
            });
        } else if (role === 'TECHNICIAN') {
            await supabase.from('technicians').insert({
                technician_id: userId,
                lab_id: null,
                is_active: true
            });
        }

        console.log(`Admin signup success for ${email} as ${role}`);
        res.json({ success: true, userId, message: 'Signup successful' });

    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Create user profile (called after Supabase auth signup)
app.post('/api/profile/create', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase not configured' });
        }

        const { userId, fullName, mobile, role } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Insert into users table
        const { error: userError } = await supabase
            .from('users')
            .insert({
                user_id: userId,
                email: req.body.email || null,
                full_name: fullName || 'User',
                mobile: mobile || null,
                role: role || 'PATIENT',
                status: (role === 'LAB' || role === 'DOCTOR') ? 'PENDING' : 'ACTIVE'
            });

        if (userError) {
            console.error('Error creating user profile:', userError);
            return res.status(500).json({ error: 'Failed to create user profile' });
        }

        // Create role-specific record
        if (role === 'PATIENT') {
            await supabase.from('patients').insert({
                patient_id: userId,
                address: req.body.address || null,
                latitude: req.body.latitude || null,
                longitude: req.body.longitude || null
            });
        } else if (role === 'LAB') {
            await supabase.from('labs').insert({
                lab_id: userId,
                lab_name: req.body.labName || 'Lab',
                registration_number: req.body.registrationNumber,
                address: req.body.address,
                latitude: req.body.latitude || null,
                longitude: req.body.longitude || null
            });
        } else if (role === 'DOCTOR') {
            await supabase.from('doctors').insert({
                doctor_id: userId,
                specialization: req.body.specialization,
                medical_registration_no: req.body.medicalRegNo,
                consultation_fee: req.body.consultationFee || 500,
                experience_years: req.body.experienceYears || 0,
                qualification: req.body.qualification || null,
                bio: req.body.bio || null,
                working_hospital: req.body.workingHospital || null,
                profile_img: req.body.profileImg || null
            });
        }

        console.log(`Profile created for user ${userId} with role ${role}`);
        res.json({ success: true, message: 'Profile created successfully' });

    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});

// Create Technician Endpoint (Called by Lab)
app.post('/api/technicians/create', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase not configured' });
        }

        const { name, email, phone, password, labId } = req.body;

        if (!email || !password || !labId) {
            return res.status(400).json({ error: 'Email, password, and Lab ID are required' });
        }

        // 1. Create Auth User (Technician)
        // Note: In production, you might want to verify that the requester is indeed the Lab Owner of labId
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: 'TECHNICIAN'
            }
        });

        if (authError) {
            console.error('Error creating technician auth:', authError);
            if (authError.code === 'email_exists' || authError.message.includes("already been registered")) {
                return res.status(400).json({ error: "This email is already registered. Please use a unique email." });
            }
            return res.status(400).json({ error: authError.message });
        }

        const technicianId = authData.user.id;

        // 2. Create User Profile
        const { error: userError } = await supabase
            .from('users')
            .insert({
                user_id: technicianId,
                email: email,
                full_name: name,
                mobile: phone,
                role: 'TECHNICIAN',
                status: 'ACTIVE'
            });

        if (userError) {
            console.error('Error creating technician user profile:', userError);
            // Consider rollback (delete auth user)
            return res.status(500).json({ error: 'Failed to create technician profile' });
        }

        // 3. Create Technician Record linked to Lab
        const { error: techError } = await supabase
            .from('technicians')
            .insert({
                technician_id: technicianId,
                lab_id: labId,
                name: name, // Assuming schema requires 'name' (even if redundant with users.full_name)
                is_active: true
            });

        if (techError) {
            console.error('Error creating technician record:', techError);
            return res.status(500).json({ error: 'Failed to link technician to lab' });
        }

        res.json({ success: true, message: 'Technician created successfully', technicianId });

    } catch (error) {
        console.error('Error in create technician:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Notify Patient of Booking Status
app.post('/api/bookings/notify', async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
            return res.status(400).json({ error: 'Booking ID and status required' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Supabase not configured' });
        }

        // 1. Fetch Booking Details (simple query without FK joins)
        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .select('patient_id, test_id, lab_id, appointment_date, time_slot, status')
            .eq('appointment_id', bookingId)
            .single();

        if (apptError || !appointment) {
            console.error('Error fetching booking:', apptError);
            return res.status(404).json({ error: 'Booking not found' });
        }

        // 2. Fetch Test Name
        let testName = 'Test';
        if (appointment.test_id) {
            const { data: test } = await supabase
                .from('lab_tests')
                .select('test_name')
                .eq('test_id', appointment.test_id)
                .single();
            if (test) testName = test.test_name;
        }

        // 3. Fetch Lab Name
        let labName = 'Lab';
        if (appointment.lab_id) {
            const { data: lab } = await supabase
                .from('labs')
                .select('lab_name')
                .eq('lab_id', appointment.lab_id)
                .single();
            if (lab) labName = lab.lab_name;
        }

        // 4. Fetch Patient Email from Auth
        const { data: { user: patientUser }, error: userError } = await supabase.auth.admin.getUserById(appointment.patient_id);

        if (userError || !patientUser || !patientUser.email) {
            console.error('Error fetching patient user:', userError);
            return res.status(404).json({ error: 'Patient email not found' });
        }

        const patientEmail = patientUser.email;
        const date = appointment.appointment_date;
        const time = appointment.time_slot;
        const formattedDate = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const bookingRef = bookingId.slice(0, 8).toUpperCase();

        // 5. Fetch Technician Email (if status is TECH_ASSIGNED)
        let technicianEmail = null;
        if (status === 'TECH_ASSIGNED' && appointment.assigned_technician_id) {
            const { data: { user: techUser }, error: techError } = await supabase.auth.admin.getUserById(appointment.assigned_technician_id);
            if (techUser) technicianEmail = techUser.email;
        }

        // Common email wrapper
        const emailWrapper = (content, bgColor = '#0d9488') => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🏥 PathoCare</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Your Trusted Diagnostic Partner</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        ${content}
                        
                        <!-- Footer -->
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #64748b; font-size: 12px; margin: 0;">
                                Need help? Contact us at <a href="mailto:support@pathocare.in" style="color: #0d9488;">support@pathocare.in</a>
                            </p>
                            <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0 0;">
                                © ${new Date().getFullYear()} PathoCare Diagnostics. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Construct Email based on status
        let subject = '';
        let htmlBody = '';

        if (status === 'BOOKED') {
            subject = `✅ Booking Confirmed - ${testName} | Ref: ${bookingRef}`;
            htmlBody = emailWrapper(`
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 35px;">✓</span>
                    </div>
                    <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Booking Confirmed!</h2>
                    <p style="color: #64748b; margin: 8px 0 0 0;">Your appointment has been accepted by the laboratory</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border: 1px solid #5eead4; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📋 Booking Reference</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${bookingRef}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🧪 Test Name</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${testName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🏥 Laboratory</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${labName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Appointment Date</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${formattedDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">⏰ Time Slot</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${time || 'To be confirmed'}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #854d0e; margin: 0; font-size: 14px;">
                        <strong>📌 Important:</strong> Please arrive 10-15 minutes before your scheduled time. For home collection, ensure someone is available at the address.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard#appointments" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">View My Appointments</a>
                </div>
            `, '#0d9488');

        } else if (status === 'TECH_ASSIGNED') {
            subject = `👨‍⚕️ Technician Assigned - ${testName} | Ref: ${bookingRef}`;
            htmlBody = emailWrapper(`
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 35px;">👨‍⚕️</span>
                    </div>
                    <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Technician Assigned!</h2>
                    <p style="color: #64748b; margin: 8px 0 0 0;">A lab technician has been assigned to your sample collection</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 1px solid #a5b4fc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📋 Booking Reference</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${bookingRef}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🧪 Test Name</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${testName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🏥 Laboratory</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${labName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Collection Date</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${formattedDate}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                        <strong>✨ What's Next:</strong> Our technician will arrive at your location during the scheduled time slot. Please keep your ID proof ready.
                    </p>
                </div>
            `, '#6366f1');

        } else if (status === 'SAMPLE_COLLECTED') {
            subject = `🧪 Sample Collected Successfully - ${testName} | Ref: ${bookingRef}`;
            htmlBody = emailWrapper(`
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 35px;">🧫</span>
                    </div>
                    <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Sample Collected!</h2>
                    <p style="color: #64748b; margin: 8px 0 0 0;">Your sample has been collected and is being processed</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📋 Booking Reference</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${bookingRef}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🧪 Test Name</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${testName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🏥 Laboratory</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${labName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📊 Status</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">Processing in Lab</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Progress Tracker -->
                <div style="margin: 25px 0;">
                    <p style="color: #1e293b; font-weight: 600; margin-bottom: 15px;">📍 Your Test Progress</p>
                    <div style="display: flex; justify-content: space-between; position: relative;">
                        <div style="flex: 1; text-align: center;">
                            <div style="width: 30px; height: 30px; background: #10b981; border-radius: 50%; margin: 0 auto 8px; color: white; line-height: 30px;">✓</div>
                            <p style="font-size: 11px; color: #64748b; margin: 0;">Booked</p>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="width: 30px; height: 30px; background: #10b981; border-radius: 50%; margin: 0 auto 8px; color: white; line-height: 30px;">✓</div>
                            <p style="font-size: 11px; color: #64748b; margin: 0;">Collected</p>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="width: 30px; height: 30px; background: #fbbf24; border-radius: 50%; margin: 0 auto 8px; color: white; line-height: 30px;">⏳</div>
                            <p style="font-size: 11px; color: #64748b; margin: 0;">Testing</p>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="width: 30px; height: 30px; background: #e2e8f0; border-radius: 50%; margin: 0 auto 8px; color: #94a3b8; line-height: 30px;">○</div>
                            <p style="font-size: 11px; color: #64748b; margin: 0;">Report</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #1e40af; margin: 0; font-size: 14px;">
                        <strong>⏱️ Expected Report:</strong> Your report will be ready within 24-48 hours. We'll notify you as soon as it's available.
                    </p>
                </div>
            `, '#f59e0b');

        } else if (status === 'REJECTED') {
            subject = `❌ Booking Request Declined - ${testName}`;
            htmlBody = emailWrapper(`
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 35px;">✕</span>
                    </div>
                    <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Booking Declined</h2>
                    <p style="color: #64748b; margin: 8px 0 0 0;">Unfortunately, your booking could not be confirmed</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🧪 Test Name</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${testName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🏥 Laboratory</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${labName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Requested Date</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${formattedDate}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #854d0e; margin: 0; font-size: 14px;">
                        <strong>Possible Reasons:</strong> The time slot may be unavailable, or the lab may be at full capacity for that day.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard#tests" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Book Another Test</a>
                </div>
            `, '#e11d48');

        } else if (status === 'REPORT_READY') {
            subject = `📊 Your Report is Ready! - ${testName} | Ref: ${bookingRef}`;
            htmlBody = emailWrapper(`
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 35px;">📄</span>
                    </div>
                    <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Report Ready!</h2>
                    <p style="color: #64748b; margin: 8px 0 0 0;">Great news! Your test results are now available</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📋 Report Reference</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${bookingRef}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🧪 Test Name</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${testName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🏥 Laboratory</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${labName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📊 Status</td>
                            <td style="padding: 8px 0; color: #16a34a; font-weight: 600; text-align: right;">✓ Completed</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard#reports" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">📥 View & Download Report</a>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #1e40af; margin: 0; font-size: 14px;">
                        <strong>💡 Tip:</strong> If you have any questions about your results, please consult with your doctor or contact us for clarification.
                    </p>
                </div>
            `, '#22c55e');

        } else {
            // Other statuses - silently ignore
            return res.json({ message: 'No email needed for this status' });
        }

        // 4. Send Email
        await transporter.sendMail({
            from: `"PathoCare Notifications" <${process.env.SMTP_USER}>`,
            to: patientEmail,
            subject: subject,
            html: htmlBody
        });

        console.log(`Email sent to ${patientEmail} for status ${status}`);
        res.json({ success: true, message: 'Notification sent' });

    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// ============================================
// AUTOMATED REPORT GENERATION
// ============================================
const PDFDocument = require('pdfkit');

// Helper: Generate a random value based on parameter definition
function generateValue(param) {
    if (param.data_type === 'TEXT') {
        // Random pick from text_options
        const options = param.text_options || ['N/A'];
        return options[Math.floor(Math.random() * options.length)];
    } else {
        // NUMERIC: Use abnormal_probability to decide range
        const isAbnormal = Math.random() < (param.abnormal_probability || 0.2);
        let value;

        if (isAbnormal) {
            // Generate outside normal range (but within min/max)
            const belowNormal = Math.random() < 0.5;
            if (belowNormal && param.min_value < param.normal_min) {
                value = param.min_value + Math.random() * (param.normal_min - param.min_value);
            } else if (param.max_value > param.normal_max) {
                value = param.normal_max + Math.random() * (param.max_value - param.normal_max);
            } else {
                // Fallback to normal if can't go outside
                value = param.normal_min + Math.random() * (param.normal_max - param.normal_min);
            }
        } else {
            // Generate within normal range
            value = param.normal_min + Math.random() * (param.normal_max - param.normal_min);
        }

        // Round appropriately based on typical precision
        if (value < 1) return value.toFixed(2);
        if (value < 100) return value.toFixed(1);
        return Math.round(value).toString();
    }
}

// POST /api/reports/generate - Auto-generate results and PDF
app.post('/api/reports/generate', async (req, res) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ error: 'appointmentId is required' });
        }

        // 1. Fetch appointment (simple query without FK joins)
        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single();

        if (apptError || !appointment) {
            console.error('Appointment fetch error:', apptError);
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // 2. Fetch related data separately
        let patientName = 'Patient';
        if (appointment.patient_id) {
            const { data: patient } = await supabase
                .from('users')
                .select('full_name')
                .eq('user_id', appointment.patient_id)
                .single();
            if (patient) patientName = patient.full_name;
        }

        let testName = 'Test';
        let sampleType = 'Blood';
        if (appointment.test_id) {
            const { data: test } = await supabase
                .from('lab_tests')
                .select('test_name, sample_type')
                .eq('test_id', appointment.test_id)
                .single();
            if (test) {
                testName = test.test_name;
                sampleType = test.sample_type || 'Blood';
            }
        }

        let labName = 'PathoCare Lab';
        let labAddress = '';
        if (appointment.lab_id) {
            const { data: lab } = await supabase
                .from('labs')
                .select('lab_name, address')
                .eq('lab_id', appointment.lab_id)
                .single();
            if (lab) {
                labName = lab.lab_name;
                labAddress = lab.address || '';
            }
        }

        // 3. Validate status (must be SAMPLE_COLLECTED to start testing)
        if (appointment.status !== 'SAMPLE_COLLECTED' && appointment.status !== 'TESTING') {
            return res.status(400).json({
                error: `Cannot generate report. Current status: ${appointment.status}. Must be SAMPLE_COLLECTED or TESTING.`
            });
        }

        // 4. Fetch test parameters
        const { data: parameters, error: paramError } = await supabase
            .from('test_parameters')
            .select('*')
            .eq('test_id', appointment.test_id)
            .order('display_order');

        if (paramError || !parameters || parameters.length === 0) {
            return res.status(400).json({ error: 'No parameters defined for this test' });
        }

        // 5. Generate values for each parameter
        const generatedResults = parameters.map(param => {
            const value = generateValue(param);
            const isAbnormal = param.data_type === 'NUMERIC'
                ? (parseFloat(value) < param.normal_min || parseFloat(value) > param.normal_max)
                : false; // For TEXT, abnormality logic can be extended

            return {
                appointment_id: appointmentId,
                parameter_id: param.id,
                value: value,
                is_abnormal: isAbnormal
            };
        });

        // 6. Insert results into report_values
        const { error: insertError } = await supabase
            .from('report_values')
            .upsert(generatedResults, { onConflict: 'appointment_id,parameter_id' });

        if (insertError) {
            console.error('Insert error:', insertError);
            return res.status(500).json({ error: 'Failed to save results' });
        }

        // 7. Generate Professional PDF
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));

        const pdfPromise = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);
        const reportId = appointmentId.slice(0, 8).toUpperCase();
        const reportDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const reportTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });

        // ========== HEADER SECTION ==========
        // Teal header banner
        doc.rect(0, 0, pageWidth, 100).fill('#0d9488');

        // Lab name (white on teal)
        doc.fillColor('#ffffff')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text(labName || 'PathoCare Diagnostics', margin, 25, { width: contentWidth });

        // Lab address
        doc.fontSize(10)
            .font('Helvetica')
            .text(labAddress || 'Quality Healthcare Services', margin, 55, { width: contentWidth });

        // Report ID badge (right side)
        doc.fillColor('#ffffff')
            .fontSize(9)
            .text(`Report ID: ${reportId}`, pageWidth - 150, 30, { width: 110, align: 'right' });
        doc.text(`Date: ${reportDate}`, pageWidth - 150, 45, { width: 110, align: 'right' });
        doc.text(`Time: ${reportTime}`, pageWidth - 150, 60, { width: 110, align: 'right' });

        // Reset color
        doc.fillColor('#000000');

        // ========== PATIENT INFORMATION SECTION ==========
        let yPos = 120;

        // Section title
        doc.fillColor('#0d9488')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('PATIENT INFORMATION', margin, yPos);

        yPos += 20;

        // Patient info box
        doc.rect(margin, yPos, contentWidth, 60)
            .lineWidth(1)
            .stroke('#e2e8f0');

        // Patient details in 2 columns
        doc.fillColor('#64748b').fontSize(9).font('Helvetica');
        doc.text('Patient Name', margin + 15, yPos + 10);
        doc.text('Test Name', margin + 15, yPos + 35);
        doc.text('Sample Type', (pageWidth / 2) + 20, yPos + 10);
        doc.text('Collection Date', (pageWidth / 2) + 20, yPos + 35);

        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold');
        doc.text(patientName, margin + 100, yPos + 10);
        doc.text(testName, margin + 100, yPos + 35);
        doc.text(sampleType, (pageWidth / 2) + 110, yPos + 10);
        doc.text(new Date(appointment.appointment_date).toLocaleDateString('en-IN'), (pageWidth / 2) + 110, yPos + 35);

        // ========== TEST RESULTS SECTION ==========
        yPos += 80;

        doc.fillColor('#0d9488')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('TEST RESULTS', margin, yPos);

        yPos += 20;

        // Table header
        const colWidths = [150, 80, 70, 110, 70];
        const headers = ['Parameter', 'Result', 'Unit', 'Reference Range', 'Status'];

        // Header background
        doc.rect(margin, yPos, contentWidth, 25).fill('#f1f5f9');

        // Header text
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
        let xPos = margin + 10;
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos + 8);
            xPos += colWidths[i];
        });

        yPos += 25;

        // Table rows
        doc.font('Helvetica').fontSize(10);

        parameters.forEach((param, index) => {
            const result = generatedResults[index];
            const normalRange = param.data_type === 'NUMERIC'
                ? `${param.normal_min} - ${param.normal_max}`
                : '-';

            // Alternate row background
            if (index % 2 === 0) {
                doc.rect(margin, yPos, contentWidth, 22).fill('#fafafa');
            }

            // Row border
            doc.rect(margin, yPos, contentWidth, 22).lineWidth(0.5).stroke('#e2e8f0');

            xPos = margin + 10;
            doc.fillColor('#1e293b');

            // Parameter name
            doc.text(param.parameter_name, xPos, yPos + 6);
            xPos += colWidths[0];

            // Result value (bold, colored if abnormal)
            doc.font('Helvetica-Bold');
            if (result.is_abnormal) {
                doc.fillColor('#dc2626'); // Red for abnormal
            }
            doc.text(result.value, xPos, yPos + 6);
            doc.font('Helvetica').fillColor('#1e293b');
            xPos += colWidths[1];

            // Unit
            doc.fillColor('#64748b');
            doc.text(param.unit || '-', xPos, yPos + 6);
            xPos += colWidths[2];

            // Reference range
            doc.text(normalRange, xPos, yPos + 6);
            xPos += colWidths[3];

            // Status badge
            if (result.is_abnormal) {
                doc.rect(xPos - 5, yPos + 3, 55, 16).fill('#fef2f2');
                doc.fillColor('#dc2626').text('Abnormal', xPos, yPos + 6);
            } else {
                doc.rect(xPos - 5, yPos + 3, 50, 16).fill('#f0fdf4');
                doc.fillColor('#16a34a').text('Normal', xPos, yPos + 6);
            }

            yPos += 22;

            // Page break if needed
            if (yPos > 700) {
                doc.addPage();
                yPos = 50;
            }
        });

        // ========== INTERPRETATION SECTION ==========
        yPos += 20;

        const abnormalCount = generatedResults.filter(r => r.is_abnormal).length;

        doc.fillColor('#0d9488')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('INTERPRETATION', margin, yPos);

        yPos += 15;

        if (abnormalCount > 0) {
            doc.rect(margin, yPos, contentWidth, 40).fill('#fef3c7');
            doc.fillColor('#92400e')
                .fontSize(10)
                .font('Helvetica')
                .text(`⚠️ ${abnormalCount} parameter(s) outside normal range. Please consult your physician for interpretation.`,
                    margin + 10, yPos + 12, { width: contentWidth - 20 });
        } else {
            doc.rect(margin, yPos, contentWidth, 40).fill('#dcfce7');
            doc.fillColor('#166534')
                .fontSize(10)
                .font('Helvetica')
                .text('✓ All parameters are within normal range.',
                    margin + 10, yPos + 12, { width: contentWidth - 20 });
        }

        // ========== FOOTER SECTION ==========
        const footerY = pageHeight - 80;

        doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).lineWidth(0.5).stroke('#e2e8f0');

        doc.fillColor('#94a3b8')
            .fontSize(8)
            .font('Helvetica')
            .text('This is a computer-generated report and does not require a signature.', margin, footerY + 15,
                { width: contentWidth, align: 'center' });

        doc.text(`Report generated by PathoCare Diagnostics on ${new Date().toLocaleString('en-IN')}`,
            margin, footerY + 30, { width: contentWidth, align: 'center' });

        doc.fillColor('#0d9488')
            .text(`Verification ID: ${reportId}-${Date.now().toString(36).toUpperCase()}`,
                margin, footerY + 45, { width: contentWidth, align: 'center' });

        doc.end();
        const pdfBuffer = await pdfPromise;

        // 7. Upload PDF to Supabase Storage
        const fileName = `${appointmentId}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(fileName, pdfBuffer, { contentType: 'application/pdf' });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload PDF' });
        }

        // 8. Save report metadata
        const { error: reportError } = await supabase
            .from('reports')
            .upsert({
                appointment_id: appointmentId,
                file_path: fileName,
                generated_at: new Date().toISOString()
            }, { onConflict: 'appointment_id' });

        if (reportError) {
            console.error('Report metadata error:', reportError);
        }

        // 9. Update appointment status to REPORT_READY
        await supabase
            .from('appointments')
            .update({ status: 'REPORT_READY' })
            .eq('appointment_id', appointmentId);

        // Note: EmailJS notification is triggered independently by the client-side labService

        console.log(`Report generated for appointment ${appointmentId}`);
        res.json({
            success: true,
            message: 'Report generated successfully',
            resultsCount: generatedResults.length,
            fileName
        });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// GET /api/reports/:appointmentId/download - Get signed URL
app.get('/api/reports/:appointmentId/download', async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // 1. Fetch report metadata
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('file_path')
            .eq('appointment_id', appointmentId)
            .single();

        if (reportError || !report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // 2. Generate signed URL (valid for 5 minutes)
        const { data: signedUrl, error: urlError } = await supabase.storage
            .from('reports')
            .createSignedUrl(report.file_path, 300);

        if (urlError) {
            return res.status(500).json({ error: 'Failed to generate download link' });
        }

        res.json({
            success: true,
            downloadUrl: signedUrl.signedUrl,
            expiresIn: 300
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to get download link' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🗄️ Supabase configured: ${supabase ? 'YES' : 'NO'}`);
});

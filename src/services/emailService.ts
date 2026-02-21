import emailjs from '@emailjs/browser';

// EmailJS credentials from environment variables
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Single dynamic template ID to replace all others
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVAL || '';

// Initialize EmailJS
if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
}

/**
 * Universal internal function to send dynamic email
 */
async function sendDynamicEmail(to_email: string, subject: string, message: string) {
    if (!SERVICE_ID || !TEMPLATE_ID) {
        console.warn('EmailJS not configured for dynamic emails. Skipping.');
        return;
    }

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        to_email,
        subject,
        message, // The dynamic content
    });
}

/**
 * Send appointment approval email (Doctor approved → notify Patient to pay)
 */
export async function sendApprovalEmail(params: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
}) {
    const subject = `Action Required: Pay to Confirm Appointment with Dr. ${params.doctorName}`;
    const message = `
Hello ${params.patientName},

Great news! Dr. ${params.doctorName} has approved your appointment request for ${params.date} at ${params.time}.

Please log in to your PathoCare dashboard and complete the payment to fully confirm your appointment.

Thank you,
PathoCare Team
    `.trim();

    return sendDynamicEmail(params.patientEmail, subject, message);
}

/**
 * Send appointment confirmation email (Payment done → confirm appointment)
 */
export async function sendConfirmationEmail(params: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    consultationType: string;
    meetingRoomId?: string;
}) {
    const subject = `Appointment Confirmed: Dr. ${params.doctorName}`;
    const meetingInfo = params.consultationType === 'video' && params.meetingRoomId
        ? `\nJoin your video call at: ${window.location.origin}/room/${params.meetingRoomId}`
        : '\nPlease visit the hospital at the scheduled time.';

    const message = `
Hello ${params.patientName},

Your appointment with Dr. ${params.doctorName} on ${params.date} at ${params.time} is officially confirmed!
${meetingInfo}

Thank you for choosing PathoCare,
PathoCare Team
    `.trim();

    return sendDynamicEmail(params.patientEmail, subject, message);
}

/**
 * Send booking status update email (Lab test status changed → notify Patient)
 */
export async function sendBookingStatusEmail(params: {
    patientEmail: string;
    patientName: string;
    bookingId: string;
    status: string;
    testName?: string;
}) {
    const statusMessages: Record<string, string> = {
        'BOOKED': 'Your test has been booked successfully.',
        'SAMPLE_COLLECTED': 'Your sample has been collected.',
        'TESTING': 'Your sample is currently being tested.',
        'REPORT_READY': 'Your test report is ready! You can view and download it from your dashboard.',
        'COMPLETED': 'Your test has been completed.',
        'TECH_ASSIGNED': 'A technician has been assigned for your sample collection (if home collection).',
        'CANCELLED': 'Your booking has been cancelled.',
    };

    const statusMsg = statusMessages[params.status] || `Your booking status has been updated to: ${params.status}.`;
    const subject = `Lab Test Status Update: ${params.testName || 'Your Booking'}`;
    const message = `
Hello ${params.patientName},

Update regarding your booking (${params.bookingId}): 
${statusMsg}

Log in to your dashboard to view full details.

Regards,
PathoCare Team
    `.trim();

    return sendDynamicEmail(params.patientEmail, subject, message);
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(params: {
    email: string;
    name?: string;
    otp: string;
}) {
    const subject = `Your Verification Code - PathoCare`;
    const message = `
Hello ${params.name || 'User'},

Your verification code is: ${params.otp}

This code will expire in 10 minutes. Please enter it securely on the page.

If you didn't request this code, please ignore this email.

Regards,
PathoCare Security
    `.trim();

    return sendDynamicEmail(params.email, subject, message);
}

/**
 * Send notification to Doctor about a new appointment request
 */
export async function sendAppointmentRequestEmail(params: {
    doctorEmail: string;
    doctorName: string;
    patientName: string;
    date: string;
    time: string;
    consultationType: string;
}) {
    const subject = `New Appointment Request: ${params.patientName}`;
    const message = `
Hello Dr. ${params.doctorName},

You have a new appointment request!
Patient: ${params.patientName}
Date: ${params.date}
Time: ${params.time}
Type: ${params.consultationType}

Please log in to your dashboard to approve or reject this request.

Regards,
PathoCare Team
    `.trim();

    return sendDynamicEmail(params.doctorEmail, subject, message);
}

/**
 * Send notification to Lab and Patient about a new lab booking
 */
export async function sendNewLabBookingEmail(params: {
    labEmail: string;
    labName: string;
    patientEmail: string;
    patientName: string;
    date: string;
    time: string;
    testName: string;
}) {
    // Notify Lab
    const labSubject = `New Booking: ${params.testName}`;
    const labMessage = `
Hello ${params.labName},

You have received a new booking.
Patient: ${params.patientName}
Test: ${params.testName}
Date: ${params.date}
Time: ${params.time}

Please log in to manage this booking.
    `.trim();
    sendDynamicEmail(params.labEmail, labSubject, labMessage).catch(console.error);

    // Notify Patient
    const userSubject = `Booking Confirmed: ${params.testName}`;
    const userMessage = `
Hello ${params.patientName},

Your booking has been successfully requested.
Lab: ${params.labName}
Test: ${params.testName}
Date: ${params.date}
Time: ${params.time}

We will notify you once a technician is assigned or your sample collection begins.

Regards,
PathoCare Team
    `.trim();
    sendDynamicEmail(params.patientEmail, userSubject, userMessage).catch(console.error);
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


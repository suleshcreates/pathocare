import { sendOTPEmail, generateOTP } from '@/services/emailService';

// In-memory OTP store (for client-side verification)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const otpService = {
    /**
     * Send OTP to email via EmailJS
     */
    async sendOTP(email: string, name?: string): Promise<{ success: boolean; message: string }> {
        const otp = generateOTP();

        // Store OTP with expiry
        otpStore.set(email.toLowerCase(), {
            otp,
            expiresAt: Date.now() + OTP_EXPIRY_MS,
        });

        // Send via EmailJS
        await sendOTPEmail({ email, name, otp });

        return { success: true, message: 'OTP sent successfully' };
    },

    /**
     * Verify OTP (client-side check)
     */
    async verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
        const stored = otpStore.get(email.toLowerCase());

        if (!stored) {
            throw new Error('No OTP found for this email. Please request a new one.');
        }

        if (Date.now() > stored.expiresAt) {
            otpStore.delete(email.toLowerCase());
            throw new Error('OTP has expired. Please request a new one.');
        }

        if (stored.otp !== otp) {
            throw new Error('Invalid OTP. Please try again.');
        }

        // OTP verified — clean up
        otpStore.delete(email.toLowerCase());
        return { success: true, message: 'OTP verified successfully' };
    },
};

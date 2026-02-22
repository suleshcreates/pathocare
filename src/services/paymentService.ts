// Razorpay Payment Service
// Handles order creation, verification, and checkout modal

declare global {
    interface Window {
        Razorpay: any;
    }
}

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface CreateOrderParams {
    amount: number;       // Amount in INR (rupees, not paise)
    bookingId: string;
    type: 'doctor' | 'lab';
}

export interface RazorpayCheckoutOptions {
    orderId: string;
    amount: number;       // In paise (as returned by backend)
    currency: string;
    key: string;
    bookingId: string;
    type: 'doctor' | 'lab';
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
    description?: string;
}

export const paymentService = {
    /**
     * Create a Razorpay order via backend
     */
    async createOrder(params: CreateOrderParams) {
        const response = await fetch(`${BACKEND_URL}/api/transactions/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || 'Failed to create order');
        }

        return response.json();
    },

    /**
     * Verify payment after Razorpay checkout
     */
    async verifyPayment(params: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        bookingId: string;
        type: 'doctor' | 'lab';
        amount?: number;
    }) {
        const response = await fetch(`${BACKEND_URL}/api/transactions/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || 'Payment verification failed');
        }

        return response.json();
    },

    /**
     * Open Razorpay checkout modal
     * Returns a promise that resolves on success, rejects on failure
     */
    openCheckout(options: RazorpayCheckoutOptions): Promise<{
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }> {
        return new Promise((resolve, reject) => {
            if (!window.Razorpay) {
                reject(new Error('Razorpay SDK not loaded. Please refresh the page.'));
                return;
            }

            const rzp = new window.Razorpay({
                key: options.key,
                amount: options.amount,
                currency: options.currency || 'INR',
                name: 'PathoCare',
                description: options.description || 'Payment',
                order_id: options.orderId,
                prefill: {
                    name: options.patientName || '',
                    email: options.patientEmail || '',
                    contact: options.patientPhone || ''
                },
                theme: {
                    color: '#0d9488' // teal-600
                },
                handler: function (response: any) {
                    resolve({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                },
                modal: {
                    ondismiss: function () {
                        reject(new Error('Payment cancelled by user'));
                    }
                }
            });

            rzp.on('payment.failed', function (response: any) {
                reject(new Error(response.error?.description || 'Payment failed'));
            });

            rzp.open();
        });
    }
};

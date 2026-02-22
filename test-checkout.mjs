async function testPayment() {
    try {
        console.log("Sending create-order request...");
        const response = await fetch('https://pathocare-backend.onrender.com/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 500,
                bookingId: 'test-booking-id-123',
                type: 'lab'
            })
        });

        const data = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Fetch threw:", e);
    }
}

testPayment();

const SERVICE_ID = 'service_3985o5m';
const TEMPLATE_ID = 'template_x2bw8wm';
const PUBLIC_KEY = '6nl0jFdeQfEsZMS3v';

async function testEmail() {
    console.log('Testing EmailJS connection...');
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    to_email: 'test@example.com',
                    subject: 'Test Subject',
                    message: 'Test message content from PathoCare script.'
                }
            })
        });

        if (response.ok) {
            console.log('Success! Email request accepted by EmailJS.');
        } else {
            const text = await response.text();
            console.error('Failed to send email:', response.status, response.statusText);
            console.error('Response:', text);
        }
    } catch (err) {
        console.error('Network Error:', err);
    }
}

testEmail();

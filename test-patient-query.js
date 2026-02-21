import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testQuery() {
    // 1. Authenticate as a LAB user (we need their email/pass or we can just mock the token)
    // Actually, let's just use the query directly to see if user_id type mismatch is the 400 Error.

    console.log('Testing users query with known patient_id...');
    const { data: patient, error: patientError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('user_id', 'df044e7f-0490-4d8e-8103-12889a833d05')
        .maybeSingle();

    if (patientError) {
        console.error("Error fetching patient:", JSON.stringify(patientError, null, 2));
    } else {
        console.log("Success fetching patient:", patient);
    }
}

testQuery();

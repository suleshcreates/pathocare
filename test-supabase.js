import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testQuery() {
    console.log('Testing users query...');
    const { data: patient, error: patientError } = await supabase
        .from('users')
        .select('full_name, email')
        .limit(1);

    if (patientError) {
        console.error("Error fetching patient:", patientError);
    } else {
        console.log("Success fetching patients:", patient);
    }

    console.log('Testing lab_tests query...');
    const { data: test, error: testError } = await supabase
        .from('lab_tests')
        .select('test_name')
        .limit(1);

    if (testError) {
        console.error("Error fetching test:", testError);
    } else {
        console.log("Success fetching test:", test);
    }
}

testQuery();

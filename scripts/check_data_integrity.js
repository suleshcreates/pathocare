import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine correct path to .env
let envPath = path.resolve(process.cwd(), 'server', '.env');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(process.cwd(), '.env');
}

console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

console.log('🔗 Connecting to Supabase...');
console.log('URL:', process.env.SUPABASE_URL);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkData() {
    try {
        console.log('\n🔍 Fetching recent 3 appointments...');
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;
        if (!appointments || appointments.length === 0) {
            console.log('❌ No appointments found!');
            return;
        }

        console.log(`Found ${appointments.length} appointments.`);

        for (const app of appointments) {
            console.log(`\n📌 Appt ID: ${app.appointment_id || app.id}`);
            console.log(`   Patient ID: ${app.patient_id}`);
            console.log(`   Test ID: ${app.test_id}`);

            // Check Patient
            const { data: patient, error: pError } = await supabase
                .from('users')
                .select('user_id, full_name, mobile')
                .eq('user_id', app.patient_id)
                .single();

            if (pError) console.log(`   ❌ Patient ERROR: ${pError.message}`);
            else if (patient) console.log(`   ✅ Patient Found: ${patient.full_name} (${patient.mobile})`);
            else console.log(`   ❌ Patient NOT FOUND in 'users' table`);

            // Check Test
            const { data: test, error: tError } = await supabase
                .from('lab_tests')
                .select('test_id, test_name, price')
                .eq('test_id', app.test_id)
                .single();

            if (tError) console.log(`   ❌ Test ERROR: ${tError.message}`);
            else if (test) console.log(`   ✅ Test Found: ${test.test_name} (Price: ${test.price})`);
            else console.log(`   ❌ Test NOT FOUND in 'lab_tests' table`);
        }

    } catch (err) {
        console.error('🔥 Unexpected error:', err);
    }
}

checkData();

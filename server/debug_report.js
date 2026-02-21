const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugReport() {
    console.log('--- Debugging Report Generation ---');

    // 1. Fetch recent appointments in relevant status
    console.log('Fetching recent appointments (SAMPLE_COLLECTED or TESTING)...');
    const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('appointment_id, test_id, status, patient_id')
        .in('status', ['SAMPLE_COLLECTED', 'TESTING'])
        .order('created_at', { ascending: false })
        .limit(5);

    if (apptError) {
        console.error('Error fetching appointments:', apptError);
        return;
    }

    if (!appointments || appointments.length === 0) {
        console.log('No appointments found in SAMPLE_COLLECTED or TESTING status.');
        return;
    }

    console.log(`Found ${appointments.length} appointments.`);

    for (const appt of appointments) {
        console.log(`\nChecking Appointment: ${appt.appointment_id}`);
        console.log(`- Status: ${appt.status}`);
        console.log(`- Test ID: ${appt.test_id}`);

        if (!appt.test_id) {
            console.error('  ERROR: Appointment has NO test_id!');
            continue;
        }

        // 2. Check if test exists
        const { data: test, error: testError } = await supabase
            .from('lab_tests')
            .select('test_name')
            .eq('test_id', appt.test_id)
            .single();

        if (testError || !test) {
            console.error(`  ERROR: Test with ID ${appt.test_id} NOT FOUND in lab_tests table.`);
            if (testError) console.error('  Details:', testError);
        } else {
            console.log(`- Test Name: ${test.test_name}`);
        }

        // 3. Check parameters
        const { data: params, error: paramError } = await supabase
            .from('test_parameters')
            .select('*')
            .eq('test_id', appt.test_id);

        if (paramError) {
            console.error('  ERROR fetching parameters:', paramError);
        } else if (!params || params.length === 0) {
            console.error('  FAILURE: No parameters found for this test_id in test_parameters table.');
        } else {
            console.log(`  SUCCESS: Found ${params.length} parameters for this test.`);
            params.forEach(p => console.log(`    - ${p.parameter_name} (${p.unit || 'no unit'})`));
        }
    }
}

debugReport().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTests() {
    console.log('--- Listing Lab Tests and Parameter Counts ---');

    // 1. Fetch all tests
    const { data: tests, error: testError } = await supabase
        .from('lab_tests')
        .select('test_id, test_name, lab_id');

    if (testError) {
        console.error('Error fetching tests:', testError);
        return;
    }

    if (!tests || tests.length === 0) {
        console.log('No tests found.');
        return;
    }

    console.log(`Found ${tests.length} tests.`);

    for (const test of tests) {
        // 2. Count parameters for each test
        const { count, error: paramError } = await supabase
            .from('test_parameters')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.test_id);

        if (paramError) {
            console.error(`Error fetching params for ${test.test_name}:`, paramError);
        } else {
            console.log(`- [${test.test_name}] (ID: ${test.test_id}) has ${count} parameters.`);
        }
    }
}

listTests().catch(console.error);

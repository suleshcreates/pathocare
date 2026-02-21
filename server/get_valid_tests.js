const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getValidTests() {
    // console.log('--- Valid Tests (With Parameters) ---');

    // 1. Fetch all tests
    const { data: tests, error: testError } = await supabase
        .from('lab_tests')
        .select('test_id, test_name, price, sample_type')
        .order('test_name');

    if (testError) {
        console.error('Error fetching tests:', testError);
        return;
    }

    if (!tests || tests.length === 0) {
        console.log('No tests found.');
        return;
    }

    const validTests = [];

    for (const test of tests) {
        // 2. Count parameters
        const { count, error: paramError } = await supabase
            .from('test_parameters')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.test_id);

        if (!paramError && count > 0) {
            validTests.push({ ...test, paramCount: count });
        }
    }

    if (validTests.length === 0) {
        console.log('No tests have parameters defined.');
    } else {
        console.log('| Test Name | Parameters | Sample Type | Price |');
        console.log('| :--- | :--- | :--- | :--- |');
        validTests.forEach(t => {
            console.log(`| ${t.test_name} | ${t.paramCount} | ${t.sample_type || 'N/A'} | ₹${t.price} |`);
        });
    }
}

getValidTests().catch(console.error);

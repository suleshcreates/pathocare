const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findEmptyTests() {
    console.log('--- Finding Tests with 0 Parameters ---');

    // 1. Fetch all tests
    const { data: tests, error: testError } = await supabase
        .from('lab_tests')
        .select('test_id, test_name');

    if (testError) {
        console.error('Error fetching tests:', testError);
        return;
    }

    const emptyTests = [];

    for (const test of tests) {
        const { count, error: paramError } = await supabase
            .from('test_parameters')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.test_id);

        if (!paramError && count === 0) {
            emptyTests.push(test.test_name);
        }
    }

    if (emptyTests.length === 0) {
        console.log('Great! All tests have parameters.');
    } else {
        console.log('Tests with 0 parameters:');
        emptyTests.forEach(name => console.log(`- ${name}`));
    }
}

findEmptyTests().catch(console.error);

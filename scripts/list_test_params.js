
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTestParams() {
    console.log('Fetching test parameters...');

    // Fetch all tests
    const { data: tests, error: testError } = await supabase
        .from('lab_tests')
        .select('test_id, test_name, category');

    if (testError) {
        console.error('Error fetching tests:', testError);
        return;
    }

    // Fetch all parameters
    const { data: params, error: paramError } = await supabase
        .from('test_parameters')
        .select('*');

    if (paramError) {
        console.error('Error fetching parameters:', paramError);
        return;
    }

    console.log(`Found ${tests.length} tests and ${params.length} parameters.`);

    // Map parameters to tests
    const testMap = {};
    tests.forEach(t => {
        testMap[t.test_id] = { ...t, params: [] };
    });

    params.forEach(p => {
        if (testMap[p.test_id]) {
            testMap[p.test_id].params.push(p);
        }
    });

    console.log('\n--- Tests with Parameters ---');
    Object.values(testMap).filter((t: any) => t.params.length > 0).forEach((t: any) => {
        console.log(`\nTest: ${t.test_name} (${t.category})`);
        t.params.forEach((p: any) => {
            console.log(`  - ${p.parameter_name} (${p.unit || ''}) [Ref: ${p.reference_range || ''}]`);
        });
    });

    console.log('\n--- Tests WITHOUT Parameters ---');
    Object.values(testMap).filter((t: any) => t.params.length === 0).forEach((t: any) => {
        console.log(`- ${t.test_name} (${t.category})`);
    });
}

listTestParams();

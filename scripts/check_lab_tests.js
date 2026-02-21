import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
// Use Service Role Key if available for updates, otherwise Anon might fail RLS if not careful, 
// but for now let's try. 

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixTests() {
    console.log('Checking lab_tests for missing lab_id...');

    // 1. Get a Lab ID to use as default
    const { data: labs, error: labError } = await supabase
        .from('labs')
        .select('*')
        .limit(1);

    if (labError || !labs || labs.length === 0) {
        console.error('Error fetching labs or no labs found:', labError);
        return;
    }

    console.log('Lab found:', labs[0]);
    const defaultLabId = labs[0].lab_id || labs[0].id || labs[0].user_id; // Try common keys
    console.log(`Using Default Lab ID: ${defaultLabId}`);

    // 2. Fetch tests with missing lab_id
    const { data: tests, error } = await supabase
        .from('lab_tests')
        .select('test_id, test_name, lab_id')
        .is('lab_id', null);

    if (error) {
        console.error('Error fetching tests:', error);
        return;
    }

    console.log(`Found ${tests.length} tests with missing lab_id.`);

    // Debug: Show first test in DB to check structure
    const { data: validTests } = await supabase.from('lab_tests').select('*').limit(1);
    if (validTests && validTests.length > 0) {
        console.log('Sample Test Data:', validTests[0]);
    }
    if (tests.length > 0) {
        console.log('Updating tests...');
        const { error: updateError } = await supabase
            .from('lab_tests')
            .update({ lab_id: defaultLabId })
            .is('lab_id', null);

        if (updateError) {
            console.error('Failed to update tests:', updateError);
        } else {
            console.log('Successfully updated tests.');
        }
    } else {
        console.log('All tests have lab_id.');
    }
}

checkAndFixTests();

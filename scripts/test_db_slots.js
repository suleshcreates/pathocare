
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('Error: .env file not found.');
    process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Key missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlots() {
    console.log('Testing connection to lab_test_slots...');
    console.log('URL:', supabaseUrl);

    // Test 1: Simple health check on a known table (users or existing)
    // or just the ONE we care about.

    const start = Date.now();
    try {
        // We use a simple select. 
        // Note: RLS might return empty array, but that counts as "Success" connectivity-wise.
        const { data, error } = await supabase
            .from('lab_test_slots')
            .select('*')
            .limit(1);

        const duration = Date.now() - start;
        console.log(`Request took ${duration}ms`);

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Connection established.');
            console.log('Data found:', data?.length);
        }
    } catch (err) {
        console.error('Network/Client Error:', err);
    }
}

checkSlots();

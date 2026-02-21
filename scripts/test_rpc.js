
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
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log("Testing RPC 'get_available_slots' with dummy data...");

    // Valid UUID format zero-filled
    const dummyLabId = '00000000-0000-0000-0000-000000000000';
    const dummyTestId = '00000000-0000-0000-0000-000000000000';
    const dummyDate = '2025-01-01'; // Future date

    const params = {
        p_lab_id: dummyLabId,
        p_test_id: dummyTestId,
        p_date: dummyDate
    };

    console.log("Params:", JSON.stringify(params, null, 2));

    const { data, error } = await supabase.rpc('get_available_slots', params);

    if (error) {
        console.error("RPC FAILED:", error);
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error("Hint:", error.hint);

        // Check for specific 400 indicators
        if (error.code === 'PGRST202' || error.message?.includes('could not find function')) {
            console.error("\n[DIAGNOSIS]: Function signature mismatch! The DB expects different parameters.");
        }
    } else {
        console.log("RPC SUCCESS!");
        console.log("Data:", data);
        console.log("\n[DIAGNOSIS]: Function signature is CORRECT.");
    }
}

testRpc();

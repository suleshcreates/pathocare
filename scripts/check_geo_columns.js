import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    console.log("Checking columns...");

    // Check Patients
    const { data: pData, error: pError } = await supabase.from('patients').select('latitude').limit(1);
    if (pError) console.log("❌ 'patients' table missing geolocation columns or error:", pError.message);
    else console.log("✅ 'patients' table has geolocation columns.");

    // Check Labs
    const { data: lData, error: lError } = await supabase.from('labs').select('latitude').limit(1);
    if (lError) console.log("❌ 'labs' table missing geolocation columns or error:", lError.message);
    else console.log("✅ 'labs' table has geolocation columns.");
}

checkColumns();

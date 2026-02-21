import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function printCols() {
    const url = `${supabaseUrl}/rest/v1/doctors?select=*&limit=1`;
    try {
        const response = await fetch(url, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log("\n--- COLUMNS ---");
            Object.keys(data[0]).forEach(k => console.log(k));
        } else {
            console.log("No data returned");
        }
    } catch (e) { console.error(e); }
}

printCols();

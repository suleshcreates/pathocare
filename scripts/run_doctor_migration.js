// Run Doctor Module Migration via Supabase SQL REST API
const fs = require('fs');
const path = require('path');

// Load env from server/.env
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
    const sql = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'migrations', '20260220_doctor_module.sql'),
        'utf8'
    );

    console.log('Running Doctor Module migration via Supabase SQL API...');
    console.log('URL:', SUPABASE_URL);

    // Use the pg_query endpoint (Supabase Management API isn't available, 
    // so we use the PostgREST RPC or direct SQL execution)
    // Best approach: use supabase-js to call raw SQL via rpc
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Split SQL into individual statements 
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
        console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);

        // Use the Supabase pg_net or direct fetch to the SQL endpoint
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({})
        });

        // This won't work for DDL either. Let's print the SQL for manual execution
    }

    console.log('\n========================================');
    console.log('NOTE: Supabase client SDK cannot run DDL directly.');
    console.log('Please copy the SQL below and run it in the Supabase SQL Editor:');
    console.log('URL: ' + SUPABASE_URL.replace('.supabase.co', '.supabase.co').replace('https://', 'https://supabase.com/dashboard/project/') + '/sql');
    console.log('========================================\n');
    console.log(sql);
}

runMigration().catch(console.error);

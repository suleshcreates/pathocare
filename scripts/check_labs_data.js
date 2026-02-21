import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Simplified env loading assuming running from project root
const envPath = 'server/.env';
console.log(`Loading .env from: ${path.resolve(envPath)}`);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.log(`File not found at ${envPath}, trying .env in root`);
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLabs() {
    console.log('Checking Labs Table...');

    const { data: labs, error } = await supabase
        .from('labs')
        .select('*');

    if (error) {
        console.error('Error fetching labs:', error);
        fs.writeFileSync('scripts/error_log.json', JSON.stringify(error, null, 2));
        return;
    }

    // The user ID reported in error: 8ca90707-e140-42b1-814e-efe3f71a9e3c
    const targetId = '8ca90707-e140-42b1-814e-efe3f71a9e3c';
    const match = labs.find(l => l.owner_id === targetId);

    if (match) {
        console.log(`✅ MATCH FOUND for User ${targetId}`);
        console.log("Lab Record:", match);
    } else {
        console.log(`❌ NO MATCH for User ${targetId}. This user has no Lab record.`);

        console.log("Attempting minimal fix...");
        // Minimal insert
        const { data: fix, error: fixError } = await supabase
            .from('labs')
            .insert({
                owner_id: targetId,
                lab_name: 'PathoCare Lab (Auto-Fixed)'
            })
            .select();

        if (fixError) {
            console.error("Failed to fix. Writing error details to scripts/error_log.json");
            fs.writeFileSync('scripts/error_log.json', JSON.stringify(fixError, null, 2));
        } else {
            console.log("✅ FIXED: Created lab record:", fix);
            // Verify
            const { data: verify } = await supabase.from('labs').select('*').eq('owner_id', targetId);
            console.log("Verified:", verify);
        }
    }
}

checkLabs();

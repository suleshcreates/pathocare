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

async function checkSchema() {
    console.log('Checking Schema Columns...');

    // Labs Table
    const { data: labs, error: labError } = await supabase
        .from('labs')
        .select('*')
        .limit(1);

    if (labError) {
        console.error('Error fetching labs:', labError);
    } else if (labs && labs.length > 0) {
        console.log('Labs Table Columns:', Object.keys(labs[0]));
    } else {
        console.log('Labs table is empty, cannot inspect columns via SELECT *');
        // Try inserting a dummy row to see error? No, safer to just check metadata.
    }

    // Technicians Table
    const { data: techs, error: techError } = await supabase
        .from('technicians')
        .select('*')
        .limit(1);

    if (techError) {
        console.error('Error fetching technicians:', techError);
    } else if (techs && techs.length > 0) {
        console.log('Technicians Table Columns:', Object.keys(techs[0]));
    } else {
        console.log('Technicians table is empty.');
    }
}

checkSchema();

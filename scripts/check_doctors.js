import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking available doctors columns...');

    // Try fetching just one row to see what columns exist
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching doctors:', error.message);
    } else {
        if (data && data.length > 0) {
            console.log('Columns currently existing in doctors table:', Object.keys(data[0]).join(', '));
        } else {
            console.log('No doctors found in table, but table exists. Trying to get columns...');
            // Insert a dummy, get it, delete it just to see columns? No, Supabase JS types don't expose schema.
            // Easiest is to select * and see keys if row exists.
            console.log('Since table is empty, we must rely on the REST API response error to see what is missing in the previous 400 error.');
        }
    }
}

checkSchema();

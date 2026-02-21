const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
    console.log('Attempting to create "reports" bucket...');

    // 1. Check if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const exists = buckets.find(b => b.name === 'reports');
    if (exists) {
        console.log('"reports" bucket already exists.');
    } else {
        // 2. Create if not exists
        const { data, error } = await supabase.storage.createBucket('reports', {
            public: false, // Private bucket, accessing via signed URLs
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
            console.error('Error creating bucket:', error);
        } else {
            console.log('Successfully created "reports" bucket:', data);
        }
    }

    // 3. Update Policy (Optional but good for RLS if we were doing frontend uploads, 
    // but here backend does upload. Signed URLs for download handle permissions).
    // However, it's good practice to verify access.
}

createBucket();

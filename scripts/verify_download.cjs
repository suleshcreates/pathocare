
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDownload() {
    console.log('Verifying download...');

    // 1. Get a file path
    const { data: report } = await supabase
        .from('reports')
        .select('file_path')
        .limit(1)
        .single();

    if (!report) {
        console.error('No reports found to test.');
        return;
    }

    console.log(`Testing file: ${report.file_path}`);

    // 2. Generate signed URL
    const { data, error } = await supabase.storage
        .from('reports') // Bucket name
        .createSignedUrl(report.file_path, 60);

    if (error) {
        console.error('Error creating signed URL:', error);
        fs.writeFileSync('download_test_result.txt', `ERROR_SIGN: ${error.message}`);
        return;
    }

    console.log(`Generated URL: ${data.signedUrl}`);

    // 3. Fetch the URL
    try {
        const response = await fetch(data.signedUrl);
        const result = `Fetch Status: ${response.status} ${response.statusText}\n`;

        if (response.ok) {
            console.log('SUCCESS: File is accessible.');
            const text = await response.text();
            fs.writeFileSync('download_test_result.txt', result + 'SUCCESS\n' + text.substring(0, 100)); // First 100 chars
        } else {
            console.error('FAILURE: Could not download file.');
            const errorText = await response.text();
            fs.writeFileSync('download_test_result.txt', result + 'FAILURE\n' + errorText);
        }
    } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        fs.writeFileSync('download_test_result.txt', 'EXCEPTION\n' + fetchError.message);
    }
}

verifyDownload();

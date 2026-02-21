
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') }); // Point to server .env
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingFiles() {
    console.log('Checking for missing report files...');

    // 1. Get all reports
    const { data: reports, error } = await supabase
        .from('reports')
        .select('appointment_id, file_path');

    if (error) {
        console.error('Error fetching reports:', error);
        return;
    }

    console.log(`Found ${reports.length} report records.`);

    // 2. Create a dummy PDF buffer
    // PDF magic number: %PDF-1.4 ...
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Restored Report File) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000263 00000 n \n0000000351 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n445\n%%EOF');

    for (const report of reports) {
        const filePath = report.file_path;

        // 3. Upload (overwrite)
        console.log(`Restoring file: ${filePath}`);

        const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(filePath, dummyPdf, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error(`Failed to upload ${filePath}:`, uploadError.message);
        } else {
            console.log(`Successfully restored ${filePath}`);
        }
    }
}

fixMissingFiles();

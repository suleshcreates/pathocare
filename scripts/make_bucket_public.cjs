
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makePublic() {
    console.log('Updating "reports" bucket to PUBLIC...');

    const { data, error } = await supabase.storage.updateBucket('reports', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['application/pdf']
    });

    if (error) {
        console.error('Error updating bucket:', error);
    } else {
        console.log('Successfully updated "reports" bucket to PUBLIC:', data);
    }
}

makePublic();

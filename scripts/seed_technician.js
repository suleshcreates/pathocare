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
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY in env');
    console.log('Current env keys:', Object.keys(process.env).filter(k => k.startsWith('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTechnician() {
    console.log('Seeding Technician...');

    // 1. Get the Lab User to link to
    const { data: labs, error: labError } = await supabase
        .from('labs')
        .select('id, owner_id')
        .limit(1);

    if (labError || !labs || labs.length === 0) {
        console.error('No labs found to attach technician to.');
        return;
    }

    const lab = labs[0];
    console.log(`Attaching technician to Lab: ${lab.id}`);

    // 2. Create Technician Auth User
    const email = 'tech@example.com';
    const password = 'password123';

    // Check if user exists first to avoid error
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId = existingUsers.users.find(u => u.email === email)?.id;

    if (!userId) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Test Technician', role: 'technician' }
        });

        if (createError) {
            console.error('Failed to create user:', createError);
            return;
        }
        userId = newUser.user.id;
        console.log(`Created new Auth User: ${userId}`);
    } else {
        console.log(`User ${email} already exists: ${userId}`);
    }

    // 3. Create/Update Public Profile in 'users' table (FIXED)
    const { error: profileError } = await supabase
        .from('users')
        .upsert({
            user_id: userId,
            full_name: 'Test Technician',
            mobile: '1234567890',
            role: 'technician',
            status: 'ACTIVE'
        });

    if (profileError) {
        console.error('Failed to create profile in users table:', profileError);
        return;
    }

    // 4. Create Technician Record
    const { error: techError } = await supabase
        .from('technicians')
        .upsert({
            technician_id: userId,
            lab_id: lab.id,
            is_active: true
        });

    if (techError) {
        console.error('Failed to link technician to lab:', techError);
        return;
    }

    console.log('✅ Technician seeded successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

seedTechnician();

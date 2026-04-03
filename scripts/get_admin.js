import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function findAdmin() {
    console.log('Searching for admin accounts...');
    const { data: admins, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('role', 'admin');

    if (error) {
        console.error("Error fetching admins:", error);
    } else {
        if (admins && admins.length > 0) {
            console.log("\nFound Admin Accounts:");
            console.table(admins);
            console.log("\nTo reset the password, use the 'Forgot Password' flow in the app or I can write a script to forcefully reset it using the Supabase Service Role key (if available).");
        } else {
            console.log("No users found with role='admin'.");
        }
    }
}

findAdmin();

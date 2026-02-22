import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking appointments columns...");
    const { data: appts, error: err1 } = await supabase.from('appointments').select('*').limit(1);
    console.log("Appts:", appts ? Object.keys(appts[0] || {}) : "No data", err1);

    console.log("Checking lab_payments columns...");
    const { data: lp, error: err2 } = await supabase.from('lab_payments').select('*').limit(1);
    console.log("Lab Payments:", lp ? Object.keys(lp[0] || {}) : "No data", err2);

    console.log("Checking doctor appointments...");
    const { data: dap, error: err3 } = await supabase.from('doctor_appointments').select('*').limit(1);
    console.log("Doctor Appts:", dap ? Object.keys(dap[0] || {}) : "No data", err3);
}

check();

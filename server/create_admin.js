require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  console.log("Creating admin account...");
  
  const email = "admin@pathocare.com";
  const password = "password123";
  const fullName = "Super Admin";

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      role: 'ADMIN',
      full_name: fullName
    }
  });

  if (authError) {
    console.error("Auth User Error:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Auth user created successfully! ID: ${userId}`);

  // 2. Create public user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      user_id: userId,
      email: email,
      full_name: fullName,
      role: 'ADMIN',
      status: 'ACTIVE'
    });

  if (profileError) {
    console.error("Public Profile Error:", profileError.message);
    process.exit(1);
  }

  console.log("✅ Admin profile created in public.users table.");
  console.log(`\nlogin Email: ${email}`);
  console.log(`login Password: ${password}\n`);
}

createAdmin();

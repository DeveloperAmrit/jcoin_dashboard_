import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { WebSocket: WebSocket }
});

const ADMINS = [
  'b24cm1008@iitj.ac.in',
  'amanager@techpark.iitj.ac.in',
  'ceo@techpark.iitj.ac.in',
  'manager@techpark.iitj.ac.in',
];

async function setupAdmins() {
  console.log('Setting up Admin Accounts...');

  for (const email of ADMINS) {
    const password = 'AdminPassword123!';

    console.log(`Creating user for: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`✅ User ${email} already exists.`);
      } else {
        console.error(`❌ Failed to create ${email}:`, error.message);
      }
    } else {
      console.log(
        `✅ Successfully created ${email} (Password: ${password})`
      );
    }
  }

  console.log(
    '\nFinished setting up admins. You can now login with these credentials and change the passwords later.'
  );
}

await setupAdmins();
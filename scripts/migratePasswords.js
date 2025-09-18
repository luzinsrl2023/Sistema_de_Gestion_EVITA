const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// This script will rely on environment variables being set.
// You can create a .env file and run `node -r dotenv/config scripts/migratePasswords.js`
// after installing dotenv: npm install dotenv

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function migratePasswords() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided as environment variables.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🚀 Starting password migration...');

    // 1. Get all users
    const { data: users, error } = await supabase
      .from('usuarios_app')
      .select('id, email, password_hash');

    if (error) throw error;

    if (!users || users.length === 0) {
      console.log('✅ No users found to migrate.');
      return;
    }

    console.log(`🔍 Found ${users.length} users. Checking passwords...`);

    for (const user of users) {
      const pwd = user.password_hash;

      // 2. Detect if it's already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (!pwd || pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$')) {
        console.log(`✅ User ${user.email} password already hashed or empty. Skipping.`);
        continue;
      }

      // 3. Generate new hash
      console.log(`⏳ Hashing password for ${user.email}...`);
      const hashed = bcrypt.hashSync(pwd, 10);

      // 4. Update the row
      const { error: updateError } = await supabase
        .from('usuarios_app')
        .update({ password_hash: hashed })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Error updating ${user.email}:`, updateError.message);
      } else {
        console.log(`🔑 Password migrated successfully for ${user.email}`);
      }
    }

    console.log('🎉 Migration completed!');
  } catch (err) {
    console.error('💥 An error occurred during migration:', err.message);
  }
}

migratePasswords();

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// WARNING: Avoid hardcoding credentials. Use environment variables in a real application.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePasswords() {
  try {
    // 1. Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('usuarios_app')
      .select('id, password'); // Assuming 'password' column exists and is plain text

    if (fetchError) {
      throw fetchError;
    }

    if (!users || users.length === 0) {
      console.log('No users found to migrate.');
      return;
    }

    console.log(`Found ${users.length} users to migrate.`);

    // 2. Hash passwords and update records
    for (const user of users) {
      if (user.password && !user.password.startsWith('$2a$')) { // Basic check if password is not already hashed
        console.log(`Migrating password for user ID: ${user.id}`);
        const hashedPassword = await bcrypt.hash(user.password, 10);

        const { error: updateError } = await supabase
          .from('usuarios_app')
          .update({ password: hashedPassword })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Failed to update password for user ID: ${user.id}`, updateError);
        } else {
          console.log(`Successfully migrated password for user ID: ${user.id}`);
        }
      } else {
        console.log(`Skipping user ID: ${user.id} (password may already be hashed or is empty).`);
      }
    }

    console.log('Password migration process completed.');
  } catch (error) {
    console.error('An error occurred during password migration:', error);
  }
}

migratePasswords();

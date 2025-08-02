require('dotenv').config({ path: './.env' });
const supabase = require('./admin-dashboard/backend/supabaseClient');

async function createAppUser() {
  const email = 'admin@beesoft.com'; // Change this to your desired app user email
  const password = 'beesoft@2025'; // Change this to your desired app user password

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Error creating app user:', error.message);
    process.exit(1);
  } else {
    console.log('App user created successfully:', data.user);
    process.exit(0);
  }
}

createAppUser();

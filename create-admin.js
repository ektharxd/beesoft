require('dotenv').config({ path: './.env' });
const supabase = require('./admin-dashboard/backend/supabaseClient');

async function createAdmin() {
  const email = 'ekthar.xd@gmail.com'; // Change this to your desired admin email
  const password = 'beesoft@2025'; // Change this to your desired admin password

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  } else {
    console.log('Admin created successfully:', data.user);
    process.exit(0);
  }
}

createAdmin();

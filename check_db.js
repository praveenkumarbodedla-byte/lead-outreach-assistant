const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing connection to Supabase...');
  
  console.log('\n--- Checking leads table ---');
  const { data: leadData, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  if (leadError) {
    console.error('Error fetching leads:', leadError);
  } else {
    console.log('Successfully connected to leads. Sample row keys:', leadData[0] ? Object.keys(leadData[0]) : 'No leads found');
  }

  console.log('\n--- Checking user_roles table ---');
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(5);

  if (roleError) {
    console.error('Error fetching user_roles:', roleError);
  } else {
    console.log('Successfully connected to user_roles. Data:', roleData);
  }
}

run();

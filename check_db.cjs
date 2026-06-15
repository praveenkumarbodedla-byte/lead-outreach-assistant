const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.replace(/\\n/gm, '\n');
        }
        value = value.replace(/(^['"]|['"]$)/g, '').trim();
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error('Error parsing .env:', e);
}

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

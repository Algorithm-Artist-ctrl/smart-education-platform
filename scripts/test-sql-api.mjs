// scripts/test-sql-api.mjs
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testEndpoints() {
  const endpoints = [
    `${url}/rest/v1/rpc/`,
    `${url}/pg/query`,
    `https://api.supabase.com/v1/projects/gzejdomnlxlxkhzhxwnc/database/query`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1;' })
      });
      console.log(`${ep}: status ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Response: ${text.slice(0, 200)}`);
    } catch (err) {
      console.log(`${ep}: error ${err.message}`);
    }
  }
}

testEndpoints();

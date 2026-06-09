import fs from 'fs';
async function run() {
  const r = await fetch('https://tpmnbglgmfqiiqxdjrwa.supabase.co/functions/v1/debug-meetings', {method: 'POST'});
  const data = await r.json();
  fs.writeFileSync('debug-data.json', JSON.stringify(data, null, 2));
}
run();

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseAdmin = createClient(
  'https://tpmnbglgmfqiiqxdjrwa.supabase.co',
  Deno.env.get('SUPABASE_ANON_KEY') || 'dummy'
);

async function test() {
  const { data } = await supabaseAdmin.from('UnifiedMeetings').select('*').order('meeting_datetime', { ascending: false }).limit(2);
  console.log(JSON.stringify(data, null, 2));
}
test();

// deploy: npx supabase functions deploy
// logs: https://supabase.com/dashboard/project/lsagjnicdssonuenzunb/functions/user-management/logs

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import {createClient} from 'https://esm.sh/@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const json = (data, status) =>
  new Response(JSON.stringify(data), {
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
    status,
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  // TODO: is it possible to call this without being logged in?

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const {action, args = []} = await req.json();
    const {data, error} = await supabase.auth.admin[action](...args);
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    return json(data, 200);
  } catch (error) {
    return json({error: error.message}, 400);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/user-management' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

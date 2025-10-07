import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: user, error } = await supabase
      .from('usuarios_app')
      .select('id, email, password_hash')
      .eq('email', email)
      .single()

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    let isValid = false;
    const isBcryptHash = user.password_hash.startsWith('$2');

    if(isBcryptHash) {
        isValid = await bcrypt.compare(password, user.password_hash);
    } else {
        isValid = user.password_hash === password;
        if(isValid) {
            const newHash = await bcrypt.hash(password);
            await supabase.from('usuarios_app').update({ password_hash: newHash }).eq('id', user.id);
        }
    }


    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    return new Response(JSON.stringify({ id: user.id, email: user.email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
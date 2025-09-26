import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rows, proveedor } = await req.json()

    if (!proveedor) throw new Error('Supplier is required.')
    if (!rows || !rows.length) throw new Error('Product data is required.')

    const { data: products, error: fetchError } = await supabaseAdmin.from('products').select('id, sku, name, price, stock')
    if (fetchError) throw fetchError

    const bySku = new Map(products.map(p => [String(p.sku || '').trim().toLowerCase(), p]))
    const byId = new Map(products.map(p => [String(p.id || '').trim().toLowerCase(), p]))
    const byName = new Map(products.map(p => [String(p.name || '').trim().toLowerCase(), p]))

    let updatedCount = 0
    const notFound = []
    const updatePromises = []

    for (const r of rows) {
      const skuKey = String(r.sku || '').trim().toLowerCase()
      const nameKey = String(r.nombre || '').trim().toLowerCase()
      const found = (skuKey && bySku.get(skuKey)) || (skuKey && byId.get(skuKey)) || (nameKey && byName.get(nameKey))

      if (!found) {
        notFound.push(r)
        continue
      }

      const patch = {}
      if (r.precio !== null && r.precio !== undefined) patch.price = r.precio
      if (r.stock !== null && r.stock !== undefined) patch.stock = Math.max(0, Math.round(r.stock))

      // Only update if there are changes
      if (Object.keys(patch).length > 0) {
        updatePromises.push(
          supabaseAdmin.from('products').update(patch).eq('id', found.id)
        )
        updatedCount++
      }
    }

    const results = await Promise.all(updatePromises)
    const errors = results.map(res => res.error).filter(Boolean)
    if (errors.length > 0) {
        // Naive error handling, we can improve this
        throw new Error(`Errors updating products: ${errors.map(e=>e.message).join(', ')}`)
    }

    return new Response(
      JSON.stringify({ updatedCount, notFound }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
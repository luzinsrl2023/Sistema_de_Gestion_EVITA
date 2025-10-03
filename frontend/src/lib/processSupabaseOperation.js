import { supabase } from '../lib/supabaseClient'

export async function processSupabaseOperation(operation) {
  const { type, table, payload, match } = operation

  if (!table) throw new Error('Tabla requerida en operación')

  if (type === 'upsert') {
    const { error } = await supabase.from(table).upsert(payload)
    if (error) throw error
    return
  }

  if (type === 'insert') {
    const { error } = await supabase.from(table).insert(payload)
    if (error) throw error
    return
  }

  if (type === 'update') {
    if (!match) throw new Error('Se requiere "match" para update')
    const { error } = await supabase.from(table).update(payload).match(match)
    if (error) throw error
    return
  }

  if (type === 'delete') {
    if (!match && !payload?.id) throw new Error('Se requiere id o match para delete')
    const query = supabase.from(table).delete()
    const { error } = match ? await query.match(match) : await query.eq('id', payload.id)
    if (error) throw error
    return
  }

  throw new Error(`Tipo de operación no soportado: ${type}`)
}



// Database configuration for Supabase
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Anon Key are required. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.")
}

// Database service factory
export const createDatabaseService = () => {
  console.log('☁️ Using Supabase')
  const supabase = createClient(supabaseUrl, supabaseKey)
  return {
    auth: supabase.auth,
    isLocal: false,
    supabase
  }
}

// Export the database service
export const db = createDatabaseService()
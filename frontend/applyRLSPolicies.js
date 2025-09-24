// Script para aplicar políticas de Row Level Security
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://qkugqstdbstirjvnalym.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWdxc3RkYnN0aXJqdm5hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MDQ2OSwiZXhwIjoyMDczNTE2NDY5fQ.Nymu9sb31t3uvcjv5j2MN14tmj1GRuSy0Rj7uVAKGJM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSPolicies() {
  console.log('🔒 Aplicando políticas de Row Level Security...');

  const queries = [
    // Habilitar RLS
    'ALTER TABLE usuarios_app ENABLE ROW LEVEL SECURITY;',
    
    // Eliminar políticas existentes
    'DROP POLICY IF EXISTS "Permitir lectura de usuarios para autenticación" ON usuarios_app;',
    'DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON usuarios_app;', 
    'DROP POLICY IF EXISTS "Permitir registro de nuevos usuarios" ON usuarios_app;',
    
    // Crear nueva política para lectura (autenticación)
    `CREATE POLICY "Permitir lectura de usuarios para autenticación" ON usuarios_app
     FOR SELECT
     USING (true);`,
    
    // Política para actualizaciones
    `CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON usuarios_app
     FOR UPDATE
     USING (auth.uid()::text = id::text);`,
    
    // Política para inserciones (registro)
    `CREATE POLICY "Permitir registro de nuevos usuarios" ON usuarios_app
     FOR INSERT
     WITH CHECK (true);`
  ];

  try {
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`📝 Ejecutando consulta ${i + 1}/${queries.length}...`);
      console.log(`   SQL: ${query.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: query
      });

      if (error) {
        console.error(`❌ Error en consulta ${i + 1}:`, error);
        // Continuamos con las demás consultas
      } else {
        console.log(`✅ Consulta ${i + 1} ejecutada exitosamente`);
      }
    }

    // Verificar políticas creadas
    console.log('\n📋 Verificando políticas creadas...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `SELECT tablename, policyname, permissive, cmd 
                   FROM pg_policies 
                   WHERE tablename = 'usuarios_app';`
      });

    if (policiesError) {
      console.error('❌ Error verificando políticas:', policiesError);
    } else {
      console.log('✅ Políticas encontradas:', policies);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el script
applyRLSPolicies();
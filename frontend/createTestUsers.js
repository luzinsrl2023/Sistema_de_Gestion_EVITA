// Script para crear usuarios de prueba en Supabase
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://qkugqstdbstirjvnalym.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWdxc3RkYnN0aXJqdm5hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MDQ2OSwiZXhwIjoyMDczNTE2NDY5fQ.Nymu9sb31t3uvcjv5j2MN14tmj1GRuSy0Rj7uVAKGJM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  console.log('🚀 Creando usuarios de prueba...');

  const testUsers = [
    {
      email: 'admin@evita.com',
      password_hash: 'admin123', // En producción, esto debería ser un hash de bcrypt
    },
    {
      email: 'usuario@evita.com', 
      password_hash: 'usuario123',
    },
    {
      email: 'gerente@evita.com',
      password_hash: 'gerente123',
    }
  ];

  try {
    for (const user of testUsers) {
      console.log(`📝 Creando usuario: ${user.email}`);
      
      const { data, error } = await supabase
        .from('usuarios_app')
        .insert([user])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`⚠️  Usuario ${user.email} ya existe`);
        } else {
          console.error(`❌ Error creando ${user.email}:`, error);
        }
      } else {
        console.log(`✅ Usuario ${user.email} creado con ID: ${data.id}`);
      }
    }

    // Verificar usuarios existentes
    console.log('\n📋 Usuarios en la base de datos:');
    const { data: allUsers, error: listError } = await supabase
      .from('usuarios_app')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
    } else {
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el script
createTestUsers();
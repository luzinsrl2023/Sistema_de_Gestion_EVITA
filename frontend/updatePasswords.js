// Script para actualizar contraseñas de usuarios existentes
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://qkugqstdbstirjvnalym.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWdxc3RkYnN0aXJqdm5hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MDQ2OSwiZXhwIjoyMDczNTE2NDY5fQ.Nymu9sb31t3uvcjv5j2MN14tmj1GRuSy0Rj7uVAKGJM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePasswords() {
  console.log('🔐 Actualizando contraseñas de usuarios...');

  const userUpdates = [
    { email: 'admin@evita.com', password: 'evita123' },
    { email: 'usuario@evita.com', password: 'usuario123' },
    { email: 'gerente@evita.com', password: 'gerente123' },
    { email: 'pamelaquiroz@evita.com', password: 'CkUEep#UM7aLqU!' },
    { email: 'claudiocaffre@evita.com', password: 'GBdc7Q2JkBXVrcYe' }
  ];

  try {
    for (const userUpdate of userUpdates) {
      console.log(`📝 Actualizando usuario: ${userUpdate.email}`);
      
      const { data, error } = await supabase
        .from('usuarios_app')
        .update({ password_hash: userUpdate.password })
        .eq('email', userUpdate.email)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error actualizando ${userUpdate.email}:`, error);
      } else {
        console.log(`✅ Usuario ${userUpdate.email} actualizado`);
      }
    }

    // Verificar usuarios actualizados
    console.log('\n📋 Usuarios en la base de datos:');
    const { data: allUsers, error: listError } = await supabase
      .from('usuarios_app')
      .select('id, email, password_hash, created_at')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
    } else {
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (password: ${user.password_hash})`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el script
updatePasswords();
// Script para poblar la base de datos con datos de muestra
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://qkugqstdbstirjvnalym.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWdxc3RkYnN0aXJqdm5hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MDQ2OSwiZXhwIjoyMDczNTE2NDY5fQ.Nymu9sb31t3uvcjv5j2MN14tmj1GRuSy0Rj7uVAKGJM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Poblando base de datos con datos de muestra...');

  try {
    // 1. Crear proveedores
    console.log('📦 Creando proveedores...');
    const proveedores = [
      {
        nombre: 'Distribuidora EVITA S.A.',
        email: 'ventas@evita.com',
        telefono: '+54 11 4567-8900',
        direccion: 'Av. Corrientes 1234, Buenos Aires'
      },
      {
        nombre: 'Química Industrial del Sur',
        email: 'pedidos@quimicasur.com',
        telefono: '+54 11 5678-9012',
        direccion: 'Zona Industrial, Quilmes'
      },
      {
        nombre: 'Eléctrica Buenos Aires',
        email: 'info@electricaba.com.ar',
        telefono: '+54 11 6789-0123',
        direccion: 'San Martín 567, CABA'
      }
    ];

    const { data: proveedoresCreados, error: errorProveedores } = await supabase
      .from('proveedores')
      .upsert(proveedores)
      .select();

    if (errorProveedores) throw errorProveedores;
    console.log(`✅ ${proveedoresCreados.length} proveedores creados`);

    // 2. Crear productos
    console.log('🧴 Creando productos...');
    const productos = [
      {
        nombre: 'Limpiador Multiuso EVITA Pro',
        descripcion: 'Limpiador concentrado para múltiples superficies',
        precio: 2850.50,
        stock: 45, // Stock bajo
        proveedor_id: proveedoresCreados[0].id
      },
      {
        nombre: 'Desinfectante Antibacterial',
        descripcion: 'Desinfectante hospitalario de amplio espectro',
        precio: 3200.00,
        stock: 8, // Stock crítico
        proveedor_id: proveedoresCreados[1].id
      },
      {
        nombre: 'Detergente Ecológico Concentrado',
        descripcion: 'Detergente biodegradable para ropa',
        precio: 4500.00,
        stock: 120,
        proveedor_id: proveedoresCreados[0].id
      },
      {
        nombre: 'Jabón Líquido para Manos',
        descripcion: 'Jabón antibacterial con glicerina',
        precio: 1800.75,
        stock: 6, // Stock crítico
        proveedor_id: proveedoresCreados[0].id
      },
      {
        nombre: 'Cable Eléctrico 2.5mm',
        descripcion: 'Cable flexible para instalaciones domiciliarias',
        precio: 850.00,
        stock: 25,
        proveedor_id: proveedoresCreados[2].id
      },
      {
        nombre: 'Bombillas LED 12W',
        descripcion: 'Lámpara LED de bajo consumo, luz cálida',
        precio: 1200.00,
        stock: 95,
        proveedor_id: proveedoresCreados[2].id
      },
      {
        nombre: 'Enchufe con Toma Tierra',
        descripcion: 'Enchufe universal con protección',
        precio: 650.00,
        stock: 4, // Stock crítico
        proveedor_id: proveedoresCreados[2].id
      }
    ];

    const { data: productosCreados, error: errorProductos } = await supabase
      .from('productos')
      .upsert(productos)
      .select();

    if (errorProductos) throw errorProductos;
    console.log(`✅ ${productosCreados.length} productos creados`);

    // 3. Crear clientes
    console.log('👥 Creando clientes...');
    const clientes = [
      {
        nombre: 'María González Distribuidora',
        email: 'maria.gonzalez@email.com',
        telefono: '+54 9 11 2345-6789',
        direccion: 'Av. San Juan 1850, Buenos Aires'
      },
      {
        nombre: 'Carlos Rodríguez - Comercial',
        email: 'carlos.rodriguez@comercial.com',
        telefono: '+54 9 11 3456-7890',
        direccion: 'Rivadavia 3456, La Plata'
      },
      {
        nombre: 'Supermercado Los Andes',
        email: 'compras@losandes.com.ar',
        telefono: '+54 11 4567-8901',
        direccion: 'Belgrano 789, Quilmes'
      },
      {
        nombre: 'Ana Martínez - Limpieza',
        email: 'ana.martinez@limpieza.com',
        telefono: '+54 9 11 5678-9012',
        direccion: 'Mitre 234, San Martín'
      },
      {
        nombre: 'Electricidad Industrial S.A.',
        email: 'ventas@elecindustrial.com',
        telefono: '+54 11 6789-0123',
        direccion: 'Zona Industrial, Avellaneda'
      }
    ];

    const { data: clientesCreados, error: errorClientes } = await supabase
      .from('clientes')
      .upsert(clientes)
      .select();

    if (errorClientes) throw errorClientes;
    console.log(`✅ ${clientesCreados.length} clientes creados`);

    // 4. Crear ventas
    console.log('💰 Creando ventas...');
    const fechaHoy = new Date();
    const fechaMesAnterior = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() - 1, fechaHoy.getDate());
    
    const ventas = [
      {
        cliente_id: clientesCreados[0].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        total: 8500.50,
        estado: 'pagada'
      },
      {
        cliente_id: clientesCreados[1].id,
        fecha: fechaMesAnterior.toISOString().split('T')[0],
        total: 12300.00,
        estado: 'pagada'
      },
      {
        cliente_id: clientesCreados[2].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        total: 6750.25,
        estado: 'pendiente'
      },
      {
        cliente_id: clientesCreados[3].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        total: 4200.00,
        estado: 'pagada'
      }
    ];

    const { data: ventasCreadas, error: errorVentas } = await supabase
      .from('ventas')
      .upsert(ventas)
      .select();

    if (errorVentas) throw errorVentas;
    console.log(`✅ ${ventasCreadas.length} ventas creadas`);

    // 5. Crear facturas
    console.log('📄 Creando facturas...');
    const facturas = [
      {
        venta_id: ventasCreadas[0].id,
        numero_factura: 'FAC-000001',
        fecha: fechaHoy.toISOString().split('T')[0],
        monto: 8500.50,
        estado: 'pagada'
      },
      {
        venta_id: ventasCreadas[1].id,
        numero_factura: 'FAC-000002',
        fecha: fechaMesAnterior.toISOString().split('T')[0],
        monto: 12300.00,
        estado: 'pagada'
      },
      {
        venta_id: ventasCreadas[2].id,
        numero_factura: 'FAC-000003',
        fecha: fechaHoy.toISOString().split('T')[0],
        monto: 6750.25,
        estado: 'emitida'
      },
      {
        venta_id: ventasCreadas[3].id,
        numero_factura: 'FAC-000004',
        fecha: fechaHoy.toISOString().split('T')[0],
        monto: 4200.00,
        estado: 'pagada'
      }
    ];

    const { data: facturasCreadas, error: errorFacturas } = await supabase
      .from('facturas')
      .upsert(facturas)
      .select();

    if (errorFacturas) throw errorFacturas;
    console.log(`✅ ${facturasCreadas.length} facturas creadas`);

    // 6. Crear cobranzas
    console.log('💳 Creando cobranzas...');
    const cobranzas = [
      {
        cliente_id: clientesCreados[0].id,
        factura_id: facturasCreadas[0].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        monto: 8500.50,
        metodo_pago: 'transferencia'
      },
      {
        cliente_id: clientesCreados[1].id,
        factura_id: facturasCreadas[1].id,
        fecha: fechaMesAnterior.toISOString().split('T')[0],
        monto: 12300.00,
        metodo_pago: 'efectivo'
      },
      {
        cliente_id: clientesCreados[3].id,
        factura_id: facturasCreadas[3].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        monto: 4200.00,
        metodo_pago: 'tarjeta'
      }
    ];

    const { data: cobranzasCreadas, error: errorCobranzas } = await supabase
      .from('cobranzas')
      .upsert(cobranzas)
      .select();

    if (errorCobranzas) throw errorCobranzas;
    console.log(`✅ ${cobranzasCreadas.length} cobranzas creadas`);

    // 7. Crear cotizaciones
    console.log('📋 Creando cotizaciones...');
    const cotizaciones = [
      {
        cliente_id: clientesCreados[4].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        total: 15600.00,
        estado: 'abierta'
      },
      {
        cliente_id: clientesCreados[2].id,
        fecha: fechaHoy.toISOString().split('T')[0],
        total: 9800.50,
        estado: 'aprobada',
        venta_id: ventasCreadas[2].id
      }
    ];

    const { data: cotizacionesCreadas, error: errorCotizaciones } = await supabase
      .from('cotizaciones')
      .upsert(cotizaciones)
      .select();

    if (errorCotizaciones) throw errorCotizaciones;
    console.log(`✅ ${cotizacionesCreadas.length} cotizaciones creadas`);

    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   • ${proveedoresCreados.length} proveedores`);
    console.log(`   • ${productosCreados.length} productos`);
    console.log(`   • ${clientesCreados.length} clientes`);
    console.log(`   • ${ventasCreadas.length} ventas`);
    console.log(`   • ${facturasCreadas.length} facturas`);
    console.log(`   • ${cobranzasCreadas.length} cobranzas`);
    console.log(`   • ${cotizacionesCreadas.length} cotizaciones`);
    
    console.log('\n⚡ El dashboard ahora mostrará datos reales!');

  } catch (error) {
    console.error('💥 Error poblando la base de datos:', error);
  }
}

// Ejecutar el script
seedDatabase();
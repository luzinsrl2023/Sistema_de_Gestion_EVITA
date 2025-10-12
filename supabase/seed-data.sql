-- Datos semilla para el sistema EVITA
-- Este script crea datos de ejemplo realistas para testing y desarrollo

-- Limpiar datos existentes (opcional - comentar en producción)
-- TRUNCATE TABLE venta_detalle CASCADE;
-- TRUNCATE TABLE ventas CASCADE;
-- TRUNCATE TABLE orden_detalle CASCADE;
-- TRUNCATE TABLE ordenes CASCADE;
-- TRUNCATE TABLE productos CASCADE;
-- TRUNCATE TABLE clientes CASCADE;
-- TRUNCATE TABLE proveedores CASCADE;

-- 1. Proveedores
INSERT INTO public.proveedores (id, nombre, email, telefono, direccion, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TecnoGlobal S.A.', 'ventas@tecnoglobal.com', '+54 11 4567-8900', 'Av. Corrientes 1234, CABA', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'LimpiezaPro Argentina', 'info@limpiezapro.com.ar', '+54 381 456-7890', 'Av. Sarmiento 567, Tucumán', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'ElectroSuministros Norte', 'contacto@electrosuministros.com', '+54 387 123-4567', 'Ruta 9 Km 1200, Salta', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Distribuidora del Norte', 'ventas@distribuidoranorte.com', '+54 3865 45-6789', 'Zona Industrial, Jujuy', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Artículos Generales SRL', 'info@articulosgenerales.com', '+54 383 456-7890', 'Centro Comercial, Santiago del Estero', NOW());

-- 2. Clientes
INSERT INTO public.clientes (id, nombre, email, telefono, direccion, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Hotel Plaza Norte', 'compras@hotelplazanorte.com', '+54 381 234-5678', 'San Martín 123, Tucumán', NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Restaurante El Buen Sabor', 'administracion@elbuensabor.com', '+54 387 345-6789', 'Belgrano 456, Salta', NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Cooperativa Agro Norte', 'compras@coopagronorte.com', '+54 3865 67-8901', 'Ruta 34 Km 15, Jujuy', NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Complejo Deportivo Municipal', 'administracion@complejodeportivo.gov.ar', '+54 383 567-8901', 'Av. Libertad 789, Santiago del Estero', NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Clínica Privada San José', 'compras@clinicasanjose.com', '+54 381 678-9012', 'Av. Sarmiento 321, Tucumán', NOW()),
('660e8400-e29b-41d4-a716-446655440006', 'Escuela Técnica N°1', 'administracion@et1.edu.ar', '+54 387 789-0123', 'San Martín 654, Salta', NOW()),
('660e8400-e29b-41d4-a716-446655440007', 'Supermercado El Ahorro', 'compras@elahorro.com', '+54 3865 89-0123', 'Centro Comercial, Jujuy', NOW()),
('660e8400-e29b-41d4-a716-446655440008', 'Oficinas Corporativas Norte', 'administracion@oficinascorporativas.com', '+54 383 890-1234', 'Zona Cívica, Santiago del Estero', NOW());

-- 3. Productos
INSERT INTO public.productos (id, nombre, descripcion, precio, stock, proveedor_id, created_at) VALUES
-- Productos de Limpieza
('770e8400-e29b-41d4-a716-446655440001', 'Limpiador Multiuso EVITA Pro', 'Detergente concentrado para todo tipo de superficies', 1250.00, 45, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'Jabón Líquido para Manos EVITA', 'Jabón antibacterial con dispensador', 850.00, 78, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'Desinfectante Antibacterial EVITA', 'Desinfectante de superficies, mata 99.9% de bacterias', 1890.00, 23, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'Papel Higiénico Suave 4 Rollos', 'Papel higiénico ultra suave, paquete de 4 rollos', 450.00, 156, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'Detergente en Polvo EVITA', 'Detergente para ropa, paquete de 3kg', 2100.00, 34, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440006', 'Limpiavidrios EVITA', 'Limpiador para vidrios y cristales', 680.00, 67, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440007', 'Escobillón Industrial', 'Escobillón de cerdas duras para limpieza pesada', 3200.00, 12, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440008', 'Trapo de Microfibra', 'Trapo absorbente para limpieza general', 180.00, 89, '550e8400-e29b-41d4-a716-446655440002', NOW()),

-- Productos Eléctricos
('770e8400-e29b-41d4-a716-446655440009', 'Bombilla LED 9W', 'Bombilla LED blanca cálida, equivalente a 60W', 1200.00, 234, '550e8400-e29b-41d4-a716-446655440003', NOW()),
('770e8400-e29b-41d4-a716-446655440010', 'Cable Eléctrico 2.5mm', 'Cable de cobre para instalaciones eléctricas', 850.00, 45, '550e8400-e29b-41d4-a716-446655440003', NOW()),
('770e8400-e29b-41d4-a716-446655440011', 'Enchufe Industrial', 'Enchufe de 3 patas para uso industrial', 450.00, 78, '550e8400-e29b-41d4-a716-446655440003', NOW()),
('770e8400-e29b-41d4-a716-446655440012', 'Interruptor Simple', 'Interruptor de luz simple para pared', 320.00, 123, '550e8400-e29b-41d4-a716-446655440003', NOW()),
('770e8400-e29b-41d4-a716-446655440013', 'Tubo LED 18W', 'Tubo LED para iluminación de oficinas', 2800.00, 56, '550e8400-e29b-41d4-a716-446655440003', NOW()),
('770e8400-e29b-41d4-a716-446655440014', 'Cable de Red Cat6', 'Cable de red para conexiones de internet', 1200.00, 34, '550e8400-e29b-41d4-a716-446655440003', NOW()),

-- Artículos Generales
('770e8400-e29b-41d4-a716-446655440015', 'Bolsa de Basura 50L', 'Bolsa de plástico para residuos', 180.00, 200, '550e8400-e29b-41d4-a716-446655440005', NOW()),
('770e8400-e29b-41d4-a716-446655440016', 'Papel A4 500 hojas', 'Resma de papel blanco para oficina', 1200.00, 89, '550e8400-e29b-41d4-a716-446655440005', NOW()),
('770e8400-e29b-41d4-a716-446655440017', 'Carpeta Archivador', 'Carpeta de cartón para documentos', 450.00, 67, '550e8400-e29b-41d4-a716-446655440005', NOW()),
('770e8400-e29b-41d4-a716-446655440018', 'Marcador Permanente', 'Marcador de tinta permanente', 120.00, 145, '550e8400-e29b-41d4-a716-446655440005', NOW()),
('770e8400-e29b-41d4-a716-446655440019', 'Cinta Adhesiva Transparente', 'Cinta adhesiva de 48mm x 50m', 280.00, 78, '550e8400-e29b-41d4-a716-446655440005', NOW()),
('770e8400-e29b-41d4-a716-446655440020', 'Tijeras de Oficina', 'Tijeras ergonómicas para oficina', 650.00, 23, '550e8400-e29b-41d4-a716-446655440005', NOW());

-- 4. Órdenes de Compra (últimos 6 meses)
INSERT INTO public.ordenes (id, proveedor_id, fecha, estado, total, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2024-06-15', 'recibida', 15600.00, NOW()),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '2024-07-20', 'recibida', 23400.00, NOW()),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '2024-08-10', 'recibida', 8900.00, NOW()),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-09-05', 'recibida', 18700.00, NOW()),
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '2024-10-12', 'recibida', 31200.00, NOW()),
('880e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', '2024-11-18', 'recibida', 12400.00, NOW()),
('880e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '2024-12-01', 'pendiente', 22100.00, NOW());

-- 5. Detalle de Órdenes
INSERT INTO public.orden_detalle (id, orden_id, producto_id, cantidad, precio_unitario) VALUES
-- Orden 1 - LimpiezaPro Argentina
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 10, 1250.00),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 15, 850.00),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 5, 1890.00),

-- Orden 2 - ElectroSuministros Norte
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440009', 20, 1200.00),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440010', 10, 850.00),
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440011', 25, 450.00),

-- Orden 3 - Artículos Generales SRL
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440015', 50, 180.00),
('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440016', 5, 1200.00),
('990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440017', 10, 450.00);

-- 6. Ventas (últimos 12 meses con distribución realista)
INSERT INTO public.ventas (id, cliente_id, fecha, total, estado, created_at) VALUES
-- Enero 2024
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-01-15', 4500.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '2024-01-22', 3200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '2024-01-28', 6800.00, 'pagada', NOW()),

-- Febrero 2024
('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '2024-02-05', 2100.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', '2024-02-12', 5600.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', '2024-02-18', 3400.00, 'pagada', NOW()),

-- Marzo 2024
('aa0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', '2024-03-08', 4200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', '2024-03-15', 7800.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440001', '2024-03-22', 2900.00, 'pagada', NOW()),

-- Abril 2024
('aa0e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440002', '2024-04-03', 5100.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440003', '2024-04-10', 6200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440004', '2024-04-17', 1800.00, 'pagada', NOW()),

-- Mayo 2024
('aa0e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440005', '2024-05-05', 4700.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440006', '2024-05-12', 3600.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440007', '2024-05-19', 5400.00, 'pagada', NOW()),

-- Junio 2024
('aa0e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440008', '2024-06-07', 8900.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440001', '2024-06-14', 3200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440002', '2024-06-21', 4800.00, 'pagada', NOW()),

-- Julio 2024
('aa0e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440003', '2024-07-09', 7200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440004', '2024-07-16', 2500.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440005', '2024-07-23', 6100.00, 'pagada', NOW()),

-- Agosto 2024
('aa0e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440006', '2024-08-11', 3900.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440007', '2024-08-18', 5200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440008', '2024-08-25', 6800.00, 'pagada', NOW()),

-- Septiembre 2024
('aa0e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440001', '2024-09-06', 4100.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440002', '2024-09-13', 5700.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440003', '2024-09-20', 7300.00, 'pagada', NOW()),

-- Octubre 2024
('aa0e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440004', '2024-10-08', 2200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440005', '2024-10-15', 5900.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440006', '2024-10-22', 3800.00, 'pagada', NOW()),

-- Noviembre 2024
('aa0e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440007', '2024-11-09', 5500.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440008', '2024-11-16', 8200.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440033', '660e8400-e29b-41d4-a716-446655440001', '2024-11-23', 3400.00, 'pagada', NOW()),

-- Diciembre 2024
('aa0e8400-e29b-41d4-a716-446655440034', '660e8400-e29b-41d4-a716-446655440002', '2024-12-04', 4600.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440003', '2024-12-11', 7100.00, 'pagada', NOW()),
('aa0e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440004', '2024-12-18', 1900.00, 'pendiente', NOW());

-- 7. Detalle de Ventas (muestra de productos vendidos)
INSERT INTO public.venta_detalle (id, venta_id, producto_id, cantidad, precio_unitario) VALUES
-- Ventas de Enero
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 2, 1250.00),
('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 3, 850.00),
('bb0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 1, 1890.00),

('bb0e8400-e29b-41d4-a716-446655440004', 'aa0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440009', 2, 1200.00),
('bb0e8400-e29b-41d4-a716-446655440005', 'aa0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440010', 1, 850.00),

('bb0e8400-e29b-41d4-a716-446655440006', 'aa0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440015', 20, 180.00),
('bb0e8400-e29b-41d4-a716-446655440007', 'aa0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440016', 2, 1200.00),
('bb0e8400-e29b-41d4-a716-446655440008', 'aa0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440017', 5, 450.00),

-- Ventas de Febrero
('bb0e8400-e29b-41d4-a716-446655440009', 'aa0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 1, 1250.00),
('bb0e8400-e29b-41d4-a716-446655440010', 'aa0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 1, 850.00),

('bb0e8400-e29b-41d4-a716-446655440011', 'aa0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440009', 3, 1200.00),
('bb0e8400-e29b-41d4-a716-446655440012', 'aa0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440011', 4, 450.00),
('bb0e8400-e29b-41d4-a716-446655440013', 'aa0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440012', 2, 320.00),

('bb0e8400-e29b-41d4-a716-446655440014', 'aa0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440015', 10, 180.00),
('bb0e8400-e29b-41d4-a716-446655440015', 'aa0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440016', 1, 1200.00),
('bb0e8400-e29b-41d4-a716-446655440016', 'aa0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440017', 2, 450.00);

-- Actualizar stock de productos según las ventas realizadas
UPDATE public.productos SET stock = stock - 2 WHERE id = '770e8400-e29b-41d4-a716-446655440001';
UPDATE public.productos SET stock = stock - 4 WHERE id = '770e8400-e29b-41d4-a716-446655440002';
UPDATE public.productos SET stock = stock - 1 WHERE id = '770e8400-e29b-41d4-a716-446655440003';
UPDATE public.productos SET stock = stock - 5 WHERE id = '770e8400-e29b-41d4-a716-446655440009';
UPDATE public.productos SET stock = stock - 1 WHERE id = '770e8400-e29b-41d4-a716-446655440010';
UPDATE public.productos SET stock = stock - 4 WHERE id = '770e8400-e29b-41d4-a716-446655440011';
UPDATE public.productos SET stock = stock - 2 WHERE id = '770e8400-e29b-41d4-a716-446655440012';
UPDATE public.productos SET stock = stock - 30 WHERE id = '770e8400-e29b-41d4-a716-446655440015';
UPDATE public.productos SET stock = stock - 3 WHERE id = '770e8400-e29b-41d4-a716-446655440016';
UPDATE public.productos SET stock = stock - 7 WHERE id = '770e8400-e29b-41d4-a716-446655440017';

-- Crear algunos productos con stock bajo para alertas
UPDATE public.productos SET stock = 3 WHERE id = '770e8400-e29b-41d4-a716-446655440007'; -- Escobillón Industrial
UPDATE public.productos SET stock = 1 WHERE id = '770e8400-e29b-41d4-a716-446655440020'; -- Tijeras de Oficina
UPDATE public.productos SET stock = 0 WHERE id = '770e8400-e29b-41d4-a716-446655440008'; -- Trapo de Microfibra (agotado)

-- Comentarios finales
COMMENT ON TABLE public.productos IS 'Catálogo de productos EVITA con categorías: Limpieza, Electricidad y Artículos Generales';
COMMENT ON TABLE public.ventas IS 'Registro de ventas realizadas a clientes del norte argentino';
COMMENT ON TABLE public.clientes IS 'Base de clientes incluyendo hoteles, restaurantes, cooperativas y empresas del norte argentino';
COMMENT ON TABLE public.proveedores IS 'Proveedores de productos para el sistema EVITA';

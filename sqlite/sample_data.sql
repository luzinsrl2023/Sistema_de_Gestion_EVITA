-- Script SQL para insertar datos de prueba iniciales

-- Insertar proveedores de prueba
INSERT OR IGNORE INTO proveedores (id, nombre, contacto, telefono, email, direccion) VALUES
('prov-001', 'Proveedor de Limpieza S.A.', 'Juan Perez', '1111-1111', 'juan@proveedorlimpieza.com', 'Av. Siempre Viva 123'),
('prov-002', 'Electricidad Industrial Ltda.', 'Maria Gonzalez', '2222-2222', 'maria@electricidadindustrial.com', 'Calle Falsa 456');

-- Insertar clientes de prueba
INSERT OR IGNORE INTO clientes (id, nombre, contacto, telefono, email, direccion) VALUES
('cli-001', 'Hotel Pacifico', 'Carlos Rodriguez', '3333-3333', 'carlos@hotelpacifico.com', 'Boulevard Costero 789'),
('cli-002', 'Oficinas Centrales S.A.', 'Ana Martinez', '4444-4444', 'ana@oficinascentrales.com', 'Zona Pradera 321');

-- Insertar productos de prueba
INSERT OR IGNORE INTO productos (id, nombre, descripcion, categoria, sku, stock_actual, stock_minimo, precio_venta) VALUES
('prod-001', 'Detergente Industrial', 'Detergente concentrado para limpieza pesada', 'limpieza', 'DET-001', 50, 10, 15.50),
('prod-002', 'Limpiador Multiusos', 'Limpiador para superficies', 'limpieza', 'LIM-001', 30, 5, 12.75),
('prod-003', 'Foco LED 15W', 'Foco ahorrador de energía', 'electricidad', 'FOL-015', 100, 20, 8.99);

-- Insertar cuentas contables básicas (si no existen)
INSERT OR IGNORE INTO cuentas_contables (id, nombre, tipo) VALUES
('1', 'Caja', 'activo'),
('2', 'Banco', 'activo'),
('3', 'Inventario', 'activo'),
('4', 'Cuentas por Cobrar', 'activo'),
('5', 'Cuentas por Pagar', 'pasivo'),
('6', 'Capital', 'patrimonio'),
('7', 'Ventas', 'ingreso'),
('8', 'Compras', 'egreso'),
('9', 'Gastos Operativos', 'egreso');
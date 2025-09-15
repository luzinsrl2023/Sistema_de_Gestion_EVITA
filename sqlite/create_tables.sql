-- Script SQL para crear la base de datos SQLite

-- Crear tabla: proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL, -- ENUM: 'limpieza', 'articulos_generales', 'electricidad', 'otros'
    sku TEXT UNIQUE,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    precio_venta REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: ordenes_compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id TEXT PRIMARY KEY,
    proveedor_id TEXT NOT NULL,
    fecha_orden DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- ENUM: 'pendiente', 'recibida', 'cancelada'
    total REAL NOT NULL,
    factura_adjunta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
);

-- Crear tabla: detalles_orden_compra
CREATE TABLE IF NOT EXISTS detalles_orden_compra (
    id TEXT PRIMARY KEY,
    orden_compra_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Crear tabla: movimientos_inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL,
    tipo_movimiento TEXT NOT NULL, -- ENUM: 'entrada', 'salida'
    cantidad INTEGER NOT NULL,
    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referencia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Crear tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: facturas_venta
CREATE TABLE IF NOT EXISTS facturas_venta (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATETIME,
    total REAL NOT NULL,
    estado_pago TEXT NOT NULL DEFAULT 'pendiente', -- ENUM: 'pendiente', 'vencida', 'pagada'
    comprobante_adjunto TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Crear tabla: detalles_factura_venta
CREATE TABLE IF NOT EXISTS detalles_factura_venta (
    id TEXT PRIMARY KEY,
    factura_venta_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_venta_id) REFERENCES facturas_venta(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Crear tabla: pagos_recibidos
CREATE TABLE IF NOT EXISTS pagos_recibidos (
    id TEXT PRIMARY KEY,
    factura_venta_id TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_venta_id) REFERENCES facturas_venta(id) ON DELETE CASCADE
);

-- Crear tabla: transacciones_caja
CREATE TABLE IF NOT EXISTS transacciones_caja (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL, -- ENUM: 'ingreso', 'egreso'
    monto REAL NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    referencia_id TEXT,
    referencia_tipo TEXT, -- ENUM: 'orden_compra', 'factura_venta', 'otro'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: cuentas_contables
CREATE TABLE IF NOT EXISTS cuentas_contables (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL, -- ENUM: 'activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: asientos_contables
CREATE TABLE IF NOT EXISTS asientos_contables (
    id TEXT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    tipo_asiento TEXT NOT NULL, -- ENUM: 'compra', 'venta', 'caja', 'manual'
    referencia_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: detalles_asiento
CREATE TABLE IF NOT EXISTS detalles_asiento (
    id TEXT PRIMARY KEY,
    asiento_id TEXT NOT NULL,
    cuenta_id TEXT NOT NULL,
    debe REAL DEFAULT 0,
    haber REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asiento_id) REFERENCES asientos_contables(id) ON DELETE CASCADE,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_contables(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_fecha ON ordenes_compra(fecha_orden);
CREATE INDEX IF NOT EXISTS idx_detalles_orden_compra_orden ON detalles_orden_compra(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_facturas_venta_cliente ON facturas_venta(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_venta_fecha ON facturas_venta(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_detalles_factura_venta_factura ON detalles_factura_venta(factura_venta_id);
CREATE INDEX IF NOT EXISTS idx_pagos_recibidos_factura ON pagos_recibidos(factura_venta_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_caja_fecha ON transacciones_caja(fecha);
CREATE INDEX IF NOT EXISTS idx_asientos_contables_fecha ON asientos_contables(fecha);
CREATE INDEX IF NOT EXISTS idx_detalles_asiento_asiento ON detalles_asiento(asiento_id);

-- Insertar cuentas contables básicas
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
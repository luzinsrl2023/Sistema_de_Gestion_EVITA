const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.resolve(__dirname, '../sqlite/gestion.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// API endpoint to update prices with a margin for a specific supplier
app.post('/api/actualizar-precios/:proveedorId/:margen', (req, res) => {
  const { proveedorId, margen } = req.params;
  const margenFloat = parseFloat(margen);

  if (!proveedorId) {
    return res.status(400).json({ ok: false, error: "El ID del proveedor es obligatorio." });
  }

  if (isNaN(margenFloat) || margenFloat < 0) {
    return res.status(400).json({ ok: false, error: "El margen debe ser un número positivo." });
  }

  const sql = `
    UPDATE productos
    SET
      margen_ganancia = ?,
      precio_final = ROUND(precio_compra * (1 + ? / 100.0), 2)
    WHERE proveedor_id = ?
  `;

  db.run(sql, [margenFloat, margenFloat, proveedorId], function(err) {
    if (err) {
      console.error('Error updating prices:', err.message);
      return res.status(500).json({ ok: false, error: "Error al actualizar precios en la base de datos" });
    }

    if (this.changes === 0) {
        return res.status(404).json({ ok: false, message: `No se encontraron productos para el proveedor con ID: ${proveedorId}` });
    }

    res.json({
      ok: true,
      message: `Precios actualizados con un margen del ${margen}% para ${this.changes} productos.`
    });
  });
});


// Basic route
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
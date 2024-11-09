import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// Obtener todos los productos
router.get('/', (req, res) => {
  db.all(`SELECT * FROM productos`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message }); // Internal Server Error
    }
    res.status(200).json(rows); // OK
  });
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM productos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message }); // Internal Server Error
    }
    if (!row) {
      return res.status(404).json({ error: 'Producto no encontrado' }); // Not Found
    }
    res.status(200).json(row); // OK
  });
});

// Agregar un nuevo producto
router.post('/', (req, res) => {
  const { nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } = req.body;

  if (!nombre || !descripcion || precio_menor == null || precio_mayor == null || precio_compra == null || !unidad || stock == null) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' }); // Bad Request
  }

  const query = `INSERT INTO productos (nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message }); // Internal Server Error
    }
    const newProductId = this.lastID;
    res.status(201).json({ id: newProductId, nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock }); // Created
  });
});

// Actualizar un producto completamente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } = req.body;

  if (!nombre || !descripcion || precio_menor == null || precio_mayor == null || precio_compra == null || !unidad || stock == null) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' }); // Bad Request
  }

  const query = `UPDATE productos SET nombre = ?, descripcion = ?, precio_menor = ?, precio_mayor = ?, precio_compra = ?, unidad = ?, stock = ? WHERE id = ?`;
  db.run(query, [nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message }); // Internal Server Error
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' }); // Not Found
    }
    res.status(200).json({ message: 'Producto actualizado', producto: { id, nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } }); // OK
  });
});

// Actualizar un producto parcialmente
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' }); // Bad Request
  }

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const query = `UPDATE productos SET ${setClause} WHERE id = ?`;

  db.run(query, [...values, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message }); // Internal Server Error
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' }); // Not Found
    }
    res.status(200).json({ message: 'Producto actualizado', producto: { id, ...fields } }); // OK
  });
});

// Eliminar un producto
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // First, retrieve the product data before deletion
  const selectQuery = `SELECT id, nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock FROM productos WHERE id = ?`;
  db.get(selectQuery, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message }); // Internal Server Error
    }
    if (!row) {
      return res.status(404).json({ error: 'Producto no encontrado' }); // Not Found
    }

    // If the product exists, proceed to delete
    db.run(`DELETE FROM productos WHERE id = ?`, [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message }); // Internal Server Error
      }
      res.status(200).json({ message: 'Producto eliminado', producto: row }); // OK
    });
  });
});

export default router;
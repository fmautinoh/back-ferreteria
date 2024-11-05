import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// Obtener todos los productos
router.get('/', (req, res) => {
  db.all(`SELECT * FROM productos`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM productos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(row);
  });
});

// Agregar un nuevo producto
router.post('/', (req, res) => {
  const { nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } = req.body;

  if (!nombre || !descripcion || precio_menor == null || precio_mayor == null || precio_compra == null || !unidad || stock == null) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `INSERT INTO productos (nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Actualizar un producto
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } = req.body;

  if (!nombre || !descripcion || precio_menor == null || precio_mayor == null || precio_compra == null || !unidad || stock == null) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `UPDATE productos SET nombre = ?, descripcion = ?, precio_menor = ?, precio_mayor = ?, precio_compra = ?, unidad = ?, stock = ? WHERE id = ?`;
  db.run(query, [nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock, id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto actualizado' });
  });
});

// Eliminar un producto
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM productos WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  });
});

export default router;

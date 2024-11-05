import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// Obtener todas las ventas
router.get('/', (req, res) => {
  db.all(`SELECT * FROM ventas`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener una venta por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM ventas WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(row);
  });
});

// Agregar una nueva venta
router.post('/', (req, res) => {
  const { fecha, tipo_documento, numero_documento, total, clienteId } = req.body;

  if (!fecha || !tipo_documento || !numero_documento || total == null || !clienteId) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `INSERT INTO ventas (fecha, tipo_documento, numero_documento, total, clienteId) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [fecha, tipo_documento, numero_documento, total, clienteId], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Actualizar una venta
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { fecha, tipo_documento, numero_documento, total, clienteId } = req.body;

  if (!fecha || !tipo_documento || !numero_documento || total == null || !clienteId) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `UPDATE ventas SET fecha = ?, tipo_documento = ?, numero_documento = ?, total = ?, clienteId = ? WHERE id = ?`;
  db.run(query, [fecha, tipo_documento, numero_documento, total, clienteId, id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta actualizada' });
  });
});

// Eliminar una venta
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM ventas WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta eliminada' });
  });
});

export default router;

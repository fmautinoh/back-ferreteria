import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// Obtener todos los clientes
router.get('/', (req, res) => {
  db.all(`SELECT * FROM clientes`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener un cliente por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM clientes WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(row);
  });
});

// Agregar un nuevo cliente
router.post('/', (req, res) => {
  const { nombre, apellido, ruc, dni, direccion, telefono, email } = req.body;

  if (!nombre || !apellido || !ruc || !direccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `INSERT INTO clientes (nombre, apellido, ruc, dni, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [nombre, apellido, ruc, dni, direccion, telefono, email], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Actualizar un cliente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ruc, dni, direccion, telefono, email } = req.body;

  if (!nombre || !apellido || !ruc || !direccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `UPDATE clientes SET nombre = ?, apellido = ?, ruc = ?, dni = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?`;
  db.run(query, [nombre, apellido, ruc, dni, direccion, telefono, email, id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente actualizado' });
  });
});

// Eliminar un cliente
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM clientes WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado' });
  });
});

export default router;

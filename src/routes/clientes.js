import express from "express";
import db from "../database/database.js";

const router = express.Router();

// Obtener todos los clientes
router.get("/", (req, res) => {
  db.all(`SELECT * FROM clientes`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener un cliente por ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM clientes WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.json(row);
  });
});

// Agregar un nuevo cliente
router.post("/", (req, res) => {
  const { nombre, apellido, ruc, dni, direccion, telefono, email } = req.body;

  if (!nombre || !apellido || !ruc || !direccion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const query = `INSERT INTO clientes (nombre, apellido, ruc, dni, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [nombre, apellido, ruc, dni, direccion, telefono, email], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({
      message: "Cliente creado",
      cliente: { id: this.lastID, nombre, apellido, ruc, dni, direccion, telefono, email }
    });
  });
});

// Actualizar un cliente
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ruc, dni, direccion, telefono, email } = req.body;

  if (!nombre || !apellido || !ruc || !direccion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const updateQuery = `UPDATE clientes SET nombre = ?, apellido = ?, ruc = ?, dni = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?`;
  db.run(updateQuery, [nombre, apellido, ruc, dni, direccion, telefono, email, id], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.json({
      message: "Cliente actualizado",
      cliente: { id, nombre, apellido, ruc, dni, direccion, telefono, email }
    });
  });
});

// Eliminar un cliente
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // First, retrieve the client data before deletion
  const selectQuery = `SELECT id, nombre, apellido, ruc, dni, direccion, telefono, email FROM clientes WHERE id = ?`;
  db.get(selectQuery, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // If the client exists, proceed to delete
    db.run(`DELETE FROM clientes WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Cliente eliminado", cliente: row });
    });
  });
});

// Actualizar parcialmente un cliente
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ruc, dni, direccion, telefono, email } = req.body;

  // Construir la consulta SQL dinámicamente
  let fields = [];
  let values = [];

  if (nombre) {
    fields.push("nombre = ?");
    values.push(nombre);
  }
  if (apellido) {
    fields.push("apellido = ?");
    values.push(apellido);
  }
  if (ruc) {
    fields.push("ruc = ?");
    values.push(ruc);
  }
  if (dni) {
    fields.push("dni = ?");
    values.push(dni);
  }
  if (direccion) {
    fields.push("direccion = ?");
    values.push(direccion);
  }
  if (telefono) {
    fields.push("telefono = ?");
    values.push(telefono);
  }
  if (email) {
    fields.push("email = ?");
    values.push(email);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  const query = `UPDATE clientes SET ${fields.join(", ")} WHERE id = ?`;
  values.push(id);

  db.run(query, values, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.json({
      message: "Cliente actualizado parcialmente",
      cliente: { id, nombre, apellido, ruc, dni, direccion, telefono, email }
    });
  });
});

export default router;
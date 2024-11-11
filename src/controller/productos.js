// productosController.js
import db from "../database/database.js";

export const getAllProductos = (req, res) => {
  db.all(`SELECT * FROM productos`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
};

export const getProductoById = (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM productos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(200).json(row);
  });
};

export const addProducto = (req, res) => {
  const { nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } = req.body;

  if (!nombre || !descripcion || precio_menor == null || precio_mayor == null || precio_compra == null || !unidad || stock == null) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const query = `INSERT INTO productos (nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const newProductId = this.lastID;
    res.status(201).json({ id: newProductId, nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock });
  });
};

export const updateProducto = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } = req.body;

  if (!nombre || !descripcion || precio_menor == null || precio_mayor == null || precio_compra == null || !unidad || stock == null) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const query = `UPDATE productos SET nombre = ?, descripcion = ?, precio_menor = ?, precio_mayor = ?, precio_compra = ?, unidad = ?, stock = ? WHERE id = ?`;
  db.run(query, [nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(200).json({ message: "Producto actualizado", producto: { id, nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock } });
  });
};

export const patchProducto = (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: "No se proporcionaron campos para actualizar" });
  }

  const setClause = keys.map(key => `${key} = ?`).join(", ");
  const query = `UPDATE productos SET ${setClause} WHERE id = ?`;

  db.run(query, [...values, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(200).json({ message: "Producto actualizado", producto: { id, ...fields } });
  });
};

export const deleteProducto = (req, res) => {
  const { id } = req.params;

  const selectQuery = `SELECT id, nombre, descripcion, precio_menor, precio_mayor, precio_compra, unidad, stock FROM productos WHERE id = ?`;
  db.get(selectQuery, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    db.run(`DELETE FROM productos WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "Producto eliminado", producto: row });
    });
  });
};
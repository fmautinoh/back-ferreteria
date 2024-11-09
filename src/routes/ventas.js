import express from "express";
import db from "../database/database.js";

const router = express.Router();

// Helper function to run queries with promises
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function allQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Obtener todas las ventas
router.get("/", async (req, res) => {
  const query = `
    SELECT v.*, dv.productoId, dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS productoNombre
    FROM ventas v
    LEFT JOIN detalleVentas dv ON v.id = dv.ventaId
    LEFT JOIN productos p ON dv.productoId = p.id
  `;
  try {
    const rows = await allQuery(query);
    const sales = rows.reduce((acc, row) => {
      const {
        id,
        fecha,
        tipo_documento,
        numero_documento,
        total,
        clienteId,
        productoId,
        cantidad,
        precio_unitario,
        subtotal,
        productoNombre,
      } = row;
      if (!acc[id]) {
        acc[id] = {
          id,
          fecha,
          tipo_documento,
          numero_documento,
          total,
          clienteId,
          detalleVentas: [],
        };
      }
      acc[id].detalleVentas.push({
        productoId,
        productoNombre,
        cantidad,
        precio_unitario,
        subtotal,
      });
      return acc;
    }, {});
    res.json(Object.values(sales));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener una venta por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT v.*, dv.productoId, dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS productoNombre
    FROM ventas v
    LEFT JOIN detalleVentas dv ON v.id = dv.ventaId
    LEFT JOIN productos p ON dv.productoId = p.id
    WHERE v.id = ?
  `;
  try {
    const rows = await allQuery(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }
    const { fecha, tipo_documento, numero_documento, total, clienteId } = rows[0];
    const detalleVentas = rows.map(({ productoId, productoNombre, cantidad, precio_unitario, subtotal }) => ({
      productoId,
      productoNombre,
      cantidad,
      precio_unitario,
      subtotal,
    }));
    res.json({
      id,
      fecha,
      tipo_documento,
      numero_documento,
      total,
      clienteId,
      detalleVentas,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar una nueva venta
router.post("/", async (req, res) => {
  const { tipo_documento, numero_documento, total, clienteId, detalleVentas } = req.body;

  const missingFields = [];
  if (!tipo_documento) missingFields.push("tipo_documento");
  if (!numero_documento) missingFields.push("numero_documento");
  if (total == null) missingFields.push("total");
  if (!clienteId) missingFields.push("clienteId");
  if (!detalleVentas || !Array.isArray(detalleVentas) || detalleVentas.length === 0) {
    missingFields.push("detalleVentas");
  }

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Faltan los siguientes campos: ${missingFields.join(", ")}` });
  }

  const fecha = new Date().toISOString().split('T')[0];

  try {
    await runQuery("BEGIN TRANSACTION");

    const ventaResult = await runQuery(
      `INSERT INTO ventas (fecha, tipo_documento, numero_documento, total, clienteId) VALUES (?, ?, ?, ?, ?)`,
      [fecha, tipo_documento, numero_documento, total, clienteId]
    );

    const ventaId = ventaResult.lastID;

    const insertDetalleQuery = `INSERT INTO detalleVentas (ventaId, productoId, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`;
    const updateStockQuery = `UPDATE productos SET stock = stock - ? WHERE id = ?`;

    for (const { productoId, cantidad, precio_unitario, subtotal } of detalleVentas) {
      await runQuery(insertDetalleQuery, [ventaId, productoId, cantidad, precio_unitario, subtotal]);
      await runQuery(updateStockQuery, [cantidad, productoId]);
    }

    await runQuery("COMMIT");

    // Devolver la venta creada con sus detalles
    res.status(201).json({
      id: ventaId,
      fecha,
      tipo_documento,
      numero_documento,
      total,
      clienteId,
      detalleVentas
    });
  } catch (err) {
    await runQuery("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una venta
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fecha, tipo_documento, numero_documento, total, clienteId, detalleVentas } = req.body;

  try {
    await runQuery("BEGIN TRANSACTION");

    const fetchCurrentDetailsQuery = `SELECT productoId, cantidad FROM detalleVentas WHERE ventaId = ?`;
    const currentDetails = await allQuery(fetchCurrentDetailsQuery, [id]);

    const updateVentaQuery = `
      UPDATE ventas
      SET fecha = ?, tipo_documento = ?, numero_documento = ?, total = ?, clienteId = ?
      WHERE id = ?
    `;
    await runQuery(updateVentaQuery, [fecha, tipo_documento, numero_documento, total, clienteId, id]);

    for (const { productoId, cantidad, precio_unitario, subtotal } of detalleVentas) {
      const currentDetail = currentDetails.find(detail => detail.productoId === productoId);
      const quantityDifference = cantidad - (currentDetail ? currentDetail.cantidad : 0);

      const updateDetalleQuery = `
        UPDATE detalleVentas
        SET cantidad = ?, precio_unitario = ?, subtotal = ?
        WHERE ventaId = ? AND productoId = ?
      `;
      await runQuery(updateDetalleQuery, [cantidad, precio_unitario, subtotal, id, productoId]);

      const updateStockQuery = `UPDATE productos SET stock = stock - ? WHERE id = ?`;
      await runQuery(updateStockQuery, [quantityDifference, productoId]);
    }

    await runQuery("COMMIT");

    // Devolver la venta actualizada con sus detalles
    res.json({
      id,
      fecha,
      tipo_documento,
      numero_documento,
      total,
      clienteId,
      detalleVentas
    });
  } catch (err) {
    await runQuery("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una venta
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await runQuery("BEGIN TRANSACTION");

    const fetchDetalleQuery = `SELECT productoId, cantidad FROM detalleVentas WHERE ventaId = ?`;
    const detalles = await allQuery(fetchDetalleQuery, [id]);

    if (detalles.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada o sin detalles" });
    }

    for (const { productoId, cantidad } of detalles) {
      const updateStockQuery = `UPDATE productos SET stock = stock + ? WHERE id = ?`;
      await runQuery(updateStockQuery, [cantidad, productoId]);
    }

    const deleteDetalleQuery = `DELETE FROM detalleVentas WHERE ventaId = ?`;
    await runQuery(deleteDetalleQuery, [id]);

    const deleteVentaQuery = `DELETE FROM ventas WHERE id = ?`;
    const result = await runQuery(deleteVentaQuery, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    await runQuery("COMMIT");

    // Devolver un mensaje de confirmación
    res.json({ message: "Venta y detalle eliminados correctamente" });
  } catch (err) {
    await runQuery("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// Actualizar parcialmente una venta
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { fecha, tipo_documento, numero_documento, total, clienteId, detalleVentas } = req.body;

  try {
    await runQuery("BEGIN TRANSACTION");

    let fields = [];
    let values = [];

    if (fecha) {
      fields.push("fecha = ?");
      values.push(fecha);
    }
    if (tipo_documento) {
      fields.push("tipo_documento = ?");
      values.push(tipo_documento);
    }
    if (numero_documento) {
      fields.push("numero_documento = ?");
      values.push(numero_documento);
    }
    if (total != null) {
      fields.push("total = ?");
      values.push(total);
    }
    if (clienteId) {
      fields.push("clienteId = ?");
      values.push(clienteId);
    }

    if (fields.length > 0) {
      const query = `UPDATE ventas SET ${fields.join(", ")} WHERE id = ?`;
      values.push(id);
      await runQuery(query, values);
    }

    if (detalleVentas && detalleVentas.length > 0) {
      const fetchCurrentDetailsQuery = `SELECT productoId, cantidad FROM detalleVentas WHERE ventaId = ?`;
      const currentDetails = await allQuery(fetchCurrentDetailsQuery, [id]);

      const deleteDetalleQuery = `DELETE FROM detalleVentas WHERE ventaId = ?`;
      await runQuery(deleteDetalleQuery, [id]);

      const insertDetalleQuery = `INSERT INTO detalleVentas (ventaId, productoId, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`;

      for (const { productoId, cantidad, precio_unitario, subtotal } of detalleVentas) {
        const currentDetail = currentDetails.find(detail => detail.productoId === productoId);
        const quantityDifference = cantidad - (currentDetail ? currentDetail.cantidad : 0);

        const updateStockQuery = `UPDATE productos SET stock = stock - ? WHERE id = ?`;
        await runQuery(updateStockQuery, [quantityDifference, productoId]);

        await runQuery(insertDetalleQuery, [id, productoId, cantidad, precio_unitario, subtotal]);
      }
    }

    await runQuery("COMMIT");

    // Devolver la venta actualizada parcialmente
    res.json({
      id,
      fecha,
      tipo_documento,
      numero_documento,
      total,
      clienteId,
      detalleVentas
    });
  } catch (err) {
    await runQuery("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

export default router;
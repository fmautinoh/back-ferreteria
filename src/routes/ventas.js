import express from "express";
import db from "../database/database.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", (req, res) => {
  const query = `
    SELECT v.*, dv.productoId, dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS productoNombre
    FROM ventas v
    LEFT JOIN detalleVentas dv ON v.id = dv.ventaId
    LEFT JOIN productos p ON dv.productoId = p.id
  `;
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Group details by sale
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
  });
});

// Obtener una venta por ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT v.*, dv.productoId, dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS productoNombre
    FROM ventas v
    LEFT JOIN detalleVentas dv ON v.id = dv.ventaId
    LEFT JOIN productos p ON dv.productoId = p.id
    WHERE v.id = ?
  `;
  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const { fecha, tipo_documento, numero_documento, total, clienteId } =
      rows[0];
    const detalleVentas = rows.map(
      ({
        productoId,
        productoNombre,
        cantidad,
        precio_unitario,
        subtotal,
      }) => ({
        productoId,
        productoNombre,
        cantidad,
        precio_unitario,
        subtotal,
      })
    );

    res.json({
      id,
      fecha,
      tipo_documento,
      numero_documento,
      total,
      clienteId,
      detalleVentas,
    });
  });
});

// Agregar una nueva venta
router.post("/", (req, res) => {
  const {
    fecha,
    tipo_documento,
    numero_documento,
    total,
    clienteId,
    detalleVentas,
  } = req.body;

  const insertVentaQuery = `
    INSERT INTO ventas (fecha, tipo_documento, numero_documento, total, clienteId)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    insertVentaQuery,
    [fecha, tipo_documento, numero_documento, total, clienteId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const ventaId = this.lastID;

      const insertDetalleQuery = `
      INSERT INTO detalleVentas (ventaId, productoId, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `;

      detalleVentas.forEach(
        ({ productoId, cantidad, precio_unitario, subtotal }) => {
          db.run(
            insertDetalleQuery,
            [ventaId, productoId, cantidad, precio_unitario, subtotal],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Update stock
              const updateStockQuery = `
          UPDATE productos
          SET stock = stock - ?
          WHERE id = ?
        `;
              db.run(updateStockQuery, [cantidad, productoId], (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
              });
            }
          );
        }
      );

      res.status(201).json({ id: ventaId });
    }
  );
});

// Actualizar una venta
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    fecha,
    tipo_documento,
    numero_documento,
    total,
    clienteId,
    detalleVentas,
  } = req.body;

  // Fetch current details to calculate stock difference
  const fetchCurrentDetailsQuery = `
    SELECT productoId, cantidad
    FROM detalleVentas
    WHERE ventaId = ?
  `;

  db.all(fetchCurrentDetailsQuery, [id], (err, currentDetails) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Update sale
    const updateVentaQuery = `
      UPDATE ventas
      SET fecha = ?, tipo_documento = ?, numero_documento = ?, total = ?, clienteId = ?
      WHERE id = ?
    `;

    db.run(
      updateVentaQuery,
      [fecha, tipo_documento, numero_documento, total, clienteId, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Update details and stock
        detalleVentas.forEach(
          ({ productoId, cantidad, precio_unitario, subtotal }) => {
            const currentDetail = currentDetails.find(
              (detail) => detail.productoId === productoId
            );
            const quantityDifference =
              cantidad - (currentDetail ? currentDetail.cantidad : 0);

            const updateDetalleQuery = `
          UPDATE detalleVentas
          SET cantidad = ?, precio_unitario = ?, subtotal = ?
          WHERE ventaId = ? AND productoId = ?
        `;

            db.run(
              updateDetalleQuery,
              [cantidad, precio_unitario, subtotal, id, productoId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                // Update stock
                const updateStockQuery = `
            UPDATE productos
            SET stock = stock - ?
            WHERE id = ?
          `;
                db.run(
                  updateStockQuery,
                  [quantityDifference, productoId],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                  }
                );
              }
            );
          }
        );

        res.json({ message: "Venta actualizada" });
      }
    );
  });
});

// Eliminar una venta
// Eliminar una venta y su detalle
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // Fetch the detalleVentas to update stock
  const fetchDetalleQuery = `
    SELECT productoId, cantidad
    FROM detalleVentas
    WHERE ventaId = ?
  `;

  db.all(fetchDetalleQuery, [id], (err, detalles) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (detalles.length === 0) {
      return res
        .status(404)
        .json({ error: "Venta no encontrada o sin detalles" });
    }

    // Update stock for each product in detalleVentas
    detalles.forEach(({ productoId, cantidad }) => {
      const updateStockQuery = `
        UPDATE productos
        SET stock = stock + ?
        WHERE id = ?
      `;
      db.run(updateStockQuery, [cantidad, productoId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
      });
    });

    // Delete detalleVentas
    const deleteDetalleQuery = `DELETE FROM detalleVentas WHERE ventaId = ?`;
    db.run(deleteDetalleQuery, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Delete the venta
      const deleteVentaQuery = `DELETE FROM ventas WHERE id = ?`;
      db.run(deleteVentaQuery, [id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Venta no encontrada" });
        }

        res.json({ message: "Venta y detalle eliminados correctamente" });
      });
    });
  });
});

// Actualizar parcialmente una venta
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const {
    fecha,
    tipo_documento,
    numero_documento,
    total,
    clienteId,
    detalleVentas,
  } = req.body;

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

  if (fields.length === 0 && !detalleVentas) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  if (fields.length > 0) {
    const query = `UPDATE ventas SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    db.run(query, values, function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }
    });
  }

  if (detalleVentas && detalleVentas.length > 0) {
    // Fetch current details to calculate stock difference
    const fetchCurrentDetailsQuery = `
      SELECT productoId, cantidad
      FROM detalleVentas
      WHERE ventaId = ?
    `;

    db.all(fetchCurrentDetailsQuery, [id], (err, currentDetails) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Delete existing details
      const deleteDetalleQuery = `DELETE FROM detalleVentas WHERE ventaId = ?`;
      db.run(deleteDetalleQuery, [id], function (err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        const detalleQuery = `INSERT INTO detalleVentas (ventaId, productoId, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`;
        const detalleStmt = db.prepare(detalleQuery);

        detalleVentas.forEach(
          ({ productoId, cantidad, precio_unitario, subtotal }) => {
            // Find the current detail for this product
            const currentDetail = currentDetails.find(
              (detail) => detail.productoId === productoId
            );
            const quantityDifference =
              cantidad - (currentDetail ? currentDetail.cantidad : 0);

            // Update stock
            const updateStockQuery = `
            UPDATE productos
            SET stock = stock - ?
            WHERE id = ?
          `;
            db.run(
              updateStockQuery,
              [quantityDifference, productoId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
              }
            );

            // Insert new detail
            detalleStmt.run(
              id,
              productoId,
              cantidad,
              precio_unitario,
              subtotal
            );
          }
        );

        detalleStmt.finalize();
      });
    });
  }

  res.json({ message: "Venta actualizada parcialmente" });
});
export default router;

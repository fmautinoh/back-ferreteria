// api/api-routes.js
import express from "express";
import apicache from "apicache";
import {
  getAllClientes,
  getClienteById,
  addCliente,
  updateCliente,
  deleteCliente,
  patchCliente,
} from "../controller/clientes.js";
import {
  getAllProductos,
  getProductoById,
  addProducto,
  updateProducto,
  patchProducto,
  deleteProducto,
} from "../controller/productos.js";
import {
  getAllSales,
  getSaleById,
  addSale,
  updateSale,
  deleteSale,
  patchSale,
} from "../controller/ventas.js";
import { login } from "../controller/usuarios.js";
import { logout } from "../controller/authlog.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import { clearCache } from "../middleware/cacheMiddleware.js";

import { registerUser } from "../controller/register.js";

const router = express.Router();
const cache = apicache.middleware;

// Rutas GET con caché
router.get("/clientes", cache("2 seconds"), isAuthenticated, getAllClientes);
router.get(
  "/clientes/:id",
  cache("2 seconds"),
  isAuthenticated,
  getClienteById
);

router.get("/productos", cache("2 seconds"), isAuthenticated, getAllProductos);
router.get(
  "/productos/:id",
  cache("2 seconds"),
  isAuthenticated,
  getProductoById
);

router.get("/ventas", cache("2 seconds"), isAuthenticated, getAllSales);
router.get("/ventas/:id", cache("2 seconds"), isAuthenticated, getSaleById);

// Rutas de escritura sin caché y con limpieza de caché
router.post("/clientes", isAuthenticated, clearCache, addCliente);
router.put("/clientes/:id", isAuthenticated, clearCache, updateCliente);
router.patch("/clientes/:id", isAuthenticated, clearCache, patchCliente);
router.delete("/clientes/:id", isAuthenticated, clearCache, deleteCliente);

router.post("/productos", isAuthenticated, clearCache, addProducto);
router.put("/productos/:id", isAuthenticated, clearCache, updateProducto);
router.patch("/productos/:id", isAuthenticated, clearCache, patchProducto);
router.delete("/productos/:id", isAuthenticated, clearCache, deleteProducto);

router.post("/ventas", isAuthenticated, clearCache, addSale);
router.put("/ventas/:id", isAuthenticated, clearCache, updateSale);
router.patch("/ventas/:id", isAuthenticated, clearCache, patchSale);
router.delete("/ventas/:id", isAuthenticated, clearCache, deleteSale);

router.post("/login", login);
router.post("/register", registerUser);
router.post("/logout", isAuthenticated, clearCache, logout);

export default router;

import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DATABASE_URL;
const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("Error al conectar a la base de datos", err.message);
    } else {
      console.log("Conectado a la base de datos SQLite");
    }
  }
);

db.serialize(() => {
  // Tabla de productos
  db.run(
    `CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    descripcion TEXT,
    precio_menor REAL,
    precio_mayor REAL,
    precio_compra REAL,
    unidad TEXT,
    stock INTEGER
  )`,
    (err) => {
      if (err) {
        console.error("Error creating productos table:", err.message);
      }
    }
  );

  // Tabla de clientes
  db.run(
    `CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellido TEXT,
    ruc TEXT,
    dni TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT
  )`,
    (err) => {
      if (err) {
        console.error("Error creating clientes table:", err.message);
      }
    }
  );

  // Tabla de ventas
  db.run(
    `CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    tipo_documento TEXT,
    numero_documento TEXT,
    total REAL,
    clienteId INTEGER,
    FOREIGN KEY (clienteId) REFERENCES clientes (id)
  )`,
    (err) => {
      if (err) {
        console.error("Error creating ventas table:", err.message);
      }
    }
  );

  // Tabla de detalle de ventas
  db.run(
    `CREATE TABLE IF NOT EXISTS detalleVentas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ventaId INTEGER,
    productoId INTEGER,
    cantidad INTEGER,
    precio_unitario REAL,
    subtotal REAL,
    FOREIGN KEY (ventaId) REFERENCES ventas (id),
    FOREIGN KEY (productoId) REFERENCES productos (id)
  )`,
    (err) => {
      if (err) {
        console.error("Error creating detalle_ventas table:", err.message);
      }
    }
  );

  // Tabla de usuarios
  db.run(
    `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`,
    (err) => {
      if (err) {
        console.error("Error creating usuarios table:", err.message);
      }
    }
  );
});
export default db;

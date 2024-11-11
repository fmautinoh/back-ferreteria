import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import clientesRouter from "./routes/clientes.js";
import productosRouter from "./routes/productos.js";
import ventasRouter from "./routes/ventas.js";
import usuariosRouter from "./routes/usuarios.js";

// Conexión a la base de datos SQLite
const dbPath = "ferreteria.db"; // Cambia esto por la ruta correcta de tu base de datos
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

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(
  session({
    secret: "!SGa37$HS%EVY73oe4aVEZ5MhSP", // Cambia esto por un secreto seguro
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }, // Cambia a true en producción y usa HTTPS
  })
);

// Middleware de autenticación
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next();
  } else {
    res
      .status(401)
      .send("Necesitas iniciar sesión para acceder a este recurso.");
  }
}

// Ruta de registro de usuario
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuario y contraseña son obligatorios" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO usuarios (username, password) VALUES (?, ?)`;
  db.run(query, [username, hashedPassword], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Ruta de inicio de sesión
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  const query = `SELECT * FROM usuarios WHERE username = ?`;
  db.get(query, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Error al acceder a la base de datos" });
    }

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Comparar la contraseña proporcionada con la almacenada
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: "Error al verificar la contraseña" });
      }

      if (isMatch) {
        req.session.isAuthenticated = true;
        res.send("Inicio de sesión exitoso");
      } else {
        res.status(401).json({ error: "Credenciales incorrectas" });
      }
    });
  });
});


// Rutas protegidas
app.use("/api/clientes", isAuthenticated, clientesRouter);
app.use("/api/productos", isAuthenticated, productosRouter);
app.use("/api/ventas", isAuthenticated, ventasRouter);
app.use("/api/usuarios", isAuthenticated, usuariosRouter);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

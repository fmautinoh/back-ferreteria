import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import db from './database/database.js';
import clientesRouter from './routes/clientes.js';
import productosRouter from './routes/productos.js';
import ventasRouter from './routes/ventas.js';
import usuariosRouter from './routes/usuarios.js';

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(session({
  secret: '!SGa37$HS%EVY73oe4aVEZ5MhSP', // Cambia esto por un secreto seguro
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a true en producción y usa HTTPS
}));

// Rutas
app.use('/api/clientes', clientesRouter);
app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/usuarios', usuariosRouter);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

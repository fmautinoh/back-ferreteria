import express from 'express';
import db from '../database/database.js';

const router = express.Router();


// Iniciar sesión
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, row.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    req.session.userId = row.id; // Guardar el ID del usuario en la sesión
    res.cookie('sessionId', req.session.id, { httpOnly: true }); // Configurar cookie de sesión
    res.json({ message: 'Inicio de sesión exitoso' });
  });
});

// Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.clearCookie('sessionId'); // Limpiar la cookie de sesión
    res.json({ message: 'Sesión cerrada' });
  });
});

// Middleware para verificar la sesión
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'No autenticado' });
};

// Ejemplo de un endpoint protegido
router.get('/perfil', isAuthenticated, (req, res) => {
  res.json({ message: 'Bienvenido a tu perfil', userId: req.session.userId });
});

export default router;

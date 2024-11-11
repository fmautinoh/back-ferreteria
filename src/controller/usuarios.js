import db from '../database/database.js';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
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

    req.session.userId = row.id;
    res.cookie('sessionId', req.session.id, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });
    res.json({ message: 'Inicio de sesión exitoso' });
  });
};
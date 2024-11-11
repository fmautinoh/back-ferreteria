// controllers/userController.js
const bcrypt = require('bcrypt');
import db from "../database/database.js";

export const registerUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Usuario y contraseña son obligatorios" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO usuarios (username, password) VALUES (?, ?)`;
        db.run(query, [username, hashedPassword], function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
};

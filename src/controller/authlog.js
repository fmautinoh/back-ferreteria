// authController.js

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.clearCookie("sessionId");
    res.json({ message: "Sesión cerrada" });
  });
};
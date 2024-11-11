// middleware/authMiddleware.js
export function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res
      .status(401)
      .send("Necesitas iniciar sesión para acceder a este recurso.");
  }
}

// middleware/cacheMiddleware.js
import apicache from "apicache";

export function clearCache(req, res, next) {
  apicache.clear();
  next();
}
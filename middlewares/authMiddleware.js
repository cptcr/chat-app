import jwt from 'jsonwebtoken';
import { log } from '../utils/logger.js';

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (token == null) {
    log.failedAttempt(`Token missing. Redirecting to login.`);
    return res.redirect('/login');
  }

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      log.failedAttempt(`Token verification failed. Redirecting to login.`);
      return res.redirect('/login');
    }
    req.user = user;
    next();
  });
};

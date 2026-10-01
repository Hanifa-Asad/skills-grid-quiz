const jwt = require('jsonwebtoken'); const { User } = require('../models');
exports.auth = (req, res, next) => {
  let id;
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new Error('Missing bearer token.');
    id = jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }

  User.findById(id).select('-password').then(user => {
    if (!user) return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    req.user = user;
    next();
  }).catch(next);
};
exports.role = (...roles) => (req, res, next) => {
  const actualRole = String(req.user?.role || '').trim().toLowerCase();
  if (roles.includes(actualRole)) return next();
  console.warn(`Access denied: expected ${roles.join(', ')}, received ${actualRole || 'no role'}.`);
  return res.status(403).json({ message: 'Access denied.' });
};

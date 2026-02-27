const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sanitizeUser = (user) => {
  const { password, ...sanitized } = user;
  return sanitized;
};

const paginate = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset };
};

module.exports = { generateToken, sanitizeUser, paginate };
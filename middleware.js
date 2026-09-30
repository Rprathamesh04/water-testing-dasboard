const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Login required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired, please login again' });
  }
}

// This decides what a user is allowed to see. Every data route uses it,
// so the role check is in one place only.
function accessFilter(user) {
  if (user.role === 'STATE') return {};
  if (user.role === 'DISTRICT') return { district: user.district };
  return { village: user.village };
}

module.exports = { verifyToken, accessFilter };

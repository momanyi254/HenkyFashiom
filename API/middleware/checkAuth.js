const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Expect header: "Authorization: Bearer <token>"
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded; // attach decoded data to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Auth failed: Invalid token' });
  }
};

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'blog',
            audience: 'blog-client'
        });
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const verifyTokenOptional = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'blog',
                audience: 'blog-client'
            });
            req.user = decoded;
        } catch (error) {
            // Invalid token, treat as guest
        }
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

const isEditorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'editor')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Editors or Admins only' });
    }
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.verifyTokenOptional = verifyTokenOptional;
module.exports.isAdmin = isAdmin;
module.exports.isEditorOrAdmin = isEditorOrAdmin;

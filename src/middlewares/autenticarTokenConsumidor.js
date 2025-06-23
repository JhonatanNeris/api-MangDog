import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function autenticarConsumidor(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Token não fornecido' });
    }

    try {
        const consumidor = jwt.verify(token, JWT_SECRET);
        req.consumidor = consumidor; // aqui você salva o ID ou dados no req
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
}

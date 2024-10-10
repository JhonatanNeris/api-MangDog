import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

function autenticarToken(req, res, next){

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do header
3
    if (!token) {
        return res.status(403).json({ message: 'Acesso negado, token não fornecido!' });
    }

    try {
        // Verifica o token
        const usuario = jwt.verify(token, JWT_SECRET);
        req.usuario = usuario;
        
        // Chama o próximo middleware ou rota
        next(); 
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado!' });
    }   

}


export default autenticarToken;
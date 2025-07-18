const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Obter o token do cabeçalho da requisição
    // O token geralmente vem no formato: "Bearer SEU_TOKEN_AQUI"
    const token = req.header('x-auth-token'); // Nome comum para o cabeçalho do token

    // Verifica se não há token
    if (!token) {
        return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
    }

    // Verifica o token
    try {
        // Verifica o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Anexa o objeto do usuário (contido no payload do token) à requisição
        req.user = decoded.user;
        next(); // Continua para a próxima função middleware/rota
    } catch (err) {
        res.status(401).json({ msg: 'Token não é válido' });
    }
};
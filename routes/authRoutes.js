const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importa o modelo de usuário

// @route   POST /api/auth/register
// @desc    Registrar um novo usuário (Admin ou Editor) - Usado para criar o primeiro admin
// @access  Public (mas em um sistema real, essa rota seria restrita para criar admins)
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Usuário já existe' });
        }

        user = new User({
            username,
            password, // A senha será hashed no middleware 'pre' do modelo
            role: role || 'editor' // Define a role, padrão 'editor' se não for fornecida
        });

        await user.save(); // Salva o usuário no banco de dados

        // Opcional: Gerar um token para o usuário recém-registrado e fazer login automático
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Sua chave secreta JWT (definiremos no .env)
            { expiresIn: '1h' }, // Token expira em 1 hora
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Retorna o token para o frontend
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// @route   POST /api/auth/login
// @desc    Autenticar usuário e obter token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Verifica se o usuário existe
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }

        // 2. Compara a senha fornecida com a senha hash no banco de dados
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }

        // 3. Se as credenciais forem válidas, cria e retorna um JSON Web Token (JWT)
        const payload = {
            user: {
                id: user.id,
                role: user.role // Inclui a role no payload do token
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Sua chave secreta JWT
            { expiresIn: '1h' }, // Token expira em 1 hora
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Envia o token para o frontend
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

module.exports = router;
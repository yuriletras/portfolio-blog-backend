// portfolio-blog-backend/server.js

require('dotenv').config(); // Carrega as variáveis de ambiente do .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const postRoutes = require('./routes/postRoutes'); // Importa as rotas de posts que você criou

const app = express();
const PORT = process.env.PORT || 5000; // Usa a porta do .env ou 5000 como fallback
const MONGO_URI = process.env.MONGO_URI;

// --- Middlewares ---
app.use(cors()); // Habilita o CORS para permitir requisições do frontend
app.use(express.json()); // Habilita o Express para parsear JSON no corpo das requisições

// --- Conexão com o Banco de Dados MongoDB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar com o MongoDB:', err));

// --- Rotas ---
app.get('/', (req, res) => {
    res.send('API do Blog está rodando!');
});

// Usa as rotas de posts sob o prefixo /api/posts
app.use('/api/posts', postRoutes);

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
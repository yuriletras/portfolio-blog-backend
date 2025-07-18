// portfolio-blog-backend/server.js

require('dotenv').config(); // Carrega as variáveis de ambiente do .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const postRoutes = require('./routes/postRoutes'); // Importa as rotas de posts
const authRoutes = require('./routes/authRoutes'); // NOVO: Importa as rotas de autenticação
const auth = require('./middleware/authMiddleware'); // NOVO: Importa o middleware de autenticação

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Conexão com o Banco de Dados MongoDB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar com o MongoDB:', err));

// --- Rotas Públicas ---
app.get('/', (req, res) => {
    res.send('API do Blog está rodando!');
});

// NOVO: Rotas de Autenticação (Públicas)
app.use('/api/auth', authRoutes);

// Rotas de Posts (Agora, apenas a leitura será pública por padrão; as outras protegeremos)
// Para que 'GET /api/posts' e 'GET /api/posts/:id' sejam públicos,
// mas 'POST', 'PUT', 'DELETE' sejam protegidas, teremos que ajustar
// dentro de 'postRoutes' ou definir aqui.
// Por simplicidade inicial, vamos proteger todas as rotas de posts que modificam dados.

// Exemplo de como proteger TODAS as rotas de posts:
// app.use('/api/posts', auth, postRoutes); // Isso protegeria TUDO em /api/posts

// --- Proteger Rotas de Posts que MODIFICAM DADOS ---
// Para proteger apenas POST, PUT, DELETE, mas permitir GET público:
// Você precisará aplicar o middleware 'auth' dentro do 'postRoutes.js'
// para as rotas específicas, ou definir rotas separadas aqui.
// Por exemplo, seu postRoutes.js terá que ser ajustado para:

// NO SEU POSTROUTES.JS (APENAS PARA ENTENDER O CONCEITO)
/*
    // Para listar todos os posts (público)
    router.get('/', postController.getAllPosts);

    // Para obter um post específico (público)
    router.get('/:id', postController.getPostById);

    // PARA CADASTRAR/EDITAR/DELETAR POSTS (AGORA PROTEGIDAS)
    const auth = require('../middleware/authMiddleware'); // Importe o middleware aqui
    router.post('/', auth, postController.createPost);
    router.put('/:id', auth, postController.updatePost);
    router.delete('/:id', auth, postController.deletePost);
*/
// Por enquanto, vamos manter `app.use('/api/posts', postRoutes);` aqui,
// e faremos os ajustes específicos para proteção dentro do `postRoutes.js`
// na próxima etapa, depois que você rodar essas primeiras modificações.

// Usando as rotas de posts (ainda sem proteção de leitura aqui no server.js principal)
app.use('/api/posts', postRoutes);


// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
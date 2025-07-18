// portfolio-blog-backend/routes/postRoutes.js
// portfolio-blog-backend/routes/postRoutes.js

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment'); // <-- Adicione esta linha

// --- Rota para obter TODOS os posts (apenas resumo) ---
// GET /api/posts
router.get('/', async (req, res) => {
    try {
        // Busca todos os posts, selecionando apenas os campos que queremos para a lista
        const posts = await Post.find({})
                                .select('title slug summary thumbnail author publishedAt category likes')
                                .sort({ publishedAt: -1 }); // Ordena do mais recente para o mais antigo

        res.json(posts); // Retorna os posts como JSON
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro do Servidor');
    }
});

// --- Rota para obter um post ESPECÍFICO pelo SLUG ---
// GET /api/posts/:slug
router.get('/:slug', async (req, res) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug });

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        // Opcional: Incrementar o contador de visualizações
        post.views = (post.views || 0) + 1;
        await post.save(); // Salva a atualização no banco de dados

        res.json(post); // Retorna o post completo
    } catch (err) {
        console.error(err.message);
        // Se o erro for um ObjectId inválido, pode ser um slug malformado
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Slug de post inválido' });
        }
        res.status(500).send('Erro do Servidor');
    }
});

// --- Rota para criar um NOVO post (para testes iniciais) ---
// POST /api/posts
// Atenção: Em um ambiente real, esta rota precisaria de autenticação e validação robusta!
router.post('/', async (req, res) => {
    const { title, summary, content, author, thumbnail, tags, category } = req.body;

    // Gerar um slug a partir do título (você pode usar uma biblioteca como 'slugify' para algo mais robusto)
    const slug = title.toLowerCase()
                      .replace(/ /g, '-')
                      .replace(/[^\w-]+/g, '');

    try {
        const newPost = new Post({
            title,
            slug,
            summary,
            content,
            author: author || 'Seu Nome', // Usa o autor fornecido ou um padrão
            thumbnail,
            tags,
            category
        });

        const post = await newPost.save(); // Salva o novo post no DB
        res.status(201).json(post); // Retorna o post criado com status 201 (Created)

    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Erro de chave duplicada (slug já existe)
            return res.status(400).json({ msg: 'Já existe um post com este título/slug.' });
        }
        res.status(500).send('Erro do Servidor');
    }
});

// portfolio-blog-backend/routes/postRoutes.js

// ... (código existente das rotas GET / e GET /:slug, e POST /) ...

// --- Rota para CURTIR um post ---
// PUT /api/posts/:slug/like
router.put('/:slug/like', async (req, res) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug });

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        // Incrementa o contador de curtidas
        post.likes = (post.likes || 0) + 1;
        await post.save(); // Salva a atualização no banco de dados

        res.json(post); // Retorna o post atualizado (com a nova contagem de curtidas)

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro do Servidor');
    }
});

// portfolio-blog-backend/routes/postRoutes.js

// ... (código existente das rotas GET /, GET /:slug, POST /, PUT /:slug/like) ...

// --- Rotas para COMENTÁRIOS ---

// @route   POST /api/posts/:slug/comments
// @desc    Adicionar um comentário a um post
// @access  Public
router.post('/:slug/comments', async (req, res) => {
    const { author, content } = req.body; // Pega autor e conteúdo do corpo da requisição

    // Validação básica
    if (!author || !content) {
        return res.status(400).json({ msg: 'Por favor, preencha todos os campos do comentário.' });
    }

    try {
        const post = await Post.findOne({ slug: req.params.slug });

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado.' });
        }

        const newComment = new Comment({
            post: post._id, // Associa o comentário ao ID do post
            author,
            content
        });

        await newComment.save(); // Salva o novo comentário no banco de dados

        // Opcional: Você pode querer adicionar o ID do comentário ao array de comentários do post
        // post.comments.push(newComment._id); // Isso exigiria um array de ObjectIds no modelo Post
        // await post.save();

        res.status(201).json(newComment); // Retorna o comentário criado com status 201 (Created)

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro do Servidor');
    }
});

// @route   GET /api/posts/:slug/comments
// @desc    Obter todos os comentários de um post
// @access  Public
router.get('/:slug/comments', async (req, res) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug });

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado.' });
        }

        // Encontra todos os comentários associados a este post
        const comments = await Comment.find({ post: post._id }).sort({ publishedAt: -1 }); // Ordena do mais novo para o mais antigo

        res.json(comments); // Retorna a lista de comentários

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro do Servidor');
    }
});

module.exports = router; // Exporta o router para ser usado no server.js
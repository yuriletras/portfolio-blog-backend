const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Certifique-se de que o caminho para seu modelo Post está correto
const auth = require('../middleware/authMiddleware'); // Importa o middleware de autenticação

// @route   GET /api/posts
// @desc    Obter todos os posts do blog
// @access  Público (não precisa de autenticação)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ publishedAt: -1 }); // Ordena por publishedAt
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// @route   GET /api/posts/:id
// @desc    Obter um post específico pelo ID
// @access  Público (não precisa de autenticação)
router.get('/:id', async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await Post.findById(postId); // Busca pelo ID

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   POST /api/posts
// @desc    Criar um novo post
// @access  Privado (requer autenticação de admin/editor)
router.post('/', auth, async (req, res) => {
    const { title, slug, summary, content, thumbnail, author } = req.body;

    try {
        const newPost = new Post({
            title,
            slug,
            summary,
            content,
            thumbnail,
            author,
        });

        const post = await newPost.save();
        res.status(201).json(post);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            return res.status(400).json({ msg: 'O slug já existe. Escolha outro.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   PUT /api/posts/:id
// @desc    Atualizar um post existente
// @access  Privado (requer autenticação de admin/editor)
router.put('/:id', auth, async (req, res) => {
    const { title, slug, summary, content, thumbnail, author } = req.body;

    const postFields = {};
    if (title) postFields.title = title;
    if (slug) postFields.slug = slug; // Manter a possibilidade de atualização de slug via ID
    if (summary) postFields.summary = summary;
    if (content) postFields.content = content;
    if (thumbnail !== undefined) {
        postFields.thumbnail = thumbnail;
    }
    if (author) postFields.author = author;
    postFields.updatedAt = Date.now();

    try {
        let post = await Post.findById(req.params.id); // Busca pelo ID

        if (!post) return res.status(404).json({ msg: 'Post não encontrado' });

        post = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: postFields },
            { new: true }
        );

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido.' });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            return res.status(400).json({ msg: 'O slug já existe. Escolha outro.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE /api/posts/:id
// @desc    Deletar um post
// @access  Privado (requer autenticação de admin/editor)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id); // Busca e deleta pelo ID

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        res.json({ msg: 'Post removido com sucesso' });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// NOVO: Rota para curtir um post
// @route   PUT /api/posts/:id/like
// @desc    Incrementa o contador de likes de um post
// @access  Público (ou Privado, se você quiser autenticação para curtir)
router.put('/:id/like', async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado.' });
        }

        // Garante que o campo 'likes' existe e é um número
        if (typeof post.likes !== 'number') {
            post.likes = 0; // Inicializa se for undefined ou não for número
        }
        post.likes += 1; // Incrementa o contador de likes

        await post.save();
        res.json({ msg: 'Post curtido com sucesso!', likes: post.likes });

    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido para curtir.' });
        }
        res.status(500).send('Erro no Servidor ao curtir o post.');
    }
});

// @route   POST /api/posts/:id/comments
// @desc    Adicionar um comentário a um post
// @access  Público
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params; // ID do post
        const { author, content } = req.body; // Dados do comentário

        if (!author || !content) {
            return res.status(400).json({ msg: 'Autor e conteúdo do comentário são obrigatórios.' });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado.' });
        }

        const newComment = {
            author,
            content,
            publishedAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(newComment);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido para adicionar comentário.' });
        }
        res.status(500).send('Erro no Servidor ao adicionar comentário.');
    }
});

// @route   GET /api/posts/:id/comments
// @desc    Obter comentários de um post
// @access  Público
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado.' });
        }

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido para carregar comentários.' });
        }
        res.status(500).send('Erro no Servidor ao carregar comentários.');
    }
});

module.exports = router;
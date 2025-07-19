const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Certifique-se de que o caminho para seu modelo Post está correto
const auth = require('../middleware/authMiddleware'); // NOVO: Importa o middleware de autenticação

// @route   GET /api/posts
// @desc    Obter todos os posts do blog
// @access  Público (não precisa de autenticação)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }); // Ordena por data mais recente
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

        const post = await Post.findById(postId);

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
    const { title, slug, summary, content, thumbnailUrl, author } = req.body;

    try {
        const newPost = new Post({
            title,
            slug,
            summary,
            content,
            thumbnailUrl,
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
    const { title, slug, summary, content, thumbnailUrl, author } = req.body;

    const postFields = {};
    if (title) postFields.title = title;
    if (slug) postFields.slug = slug;
    if (summary) postFields.summary = summary;
    if (content) postFields.content = content;
    if (thumbnailUrl) postFields.thumbnailUrl = thumbnailUrl;
    if (author) postFields.author = author;
    postFields.updatedAt = Date.now();

    try {
        let post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ msg: 'Post não encontrado' });

        post = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: postFields },
            { new: true }
        );

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post não encontrado' });
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
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Post removido com sucesso' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.status(500).send('Erro no Servidor');
    }
});


// NOVO: Rota para adicionar um comentário a um post específico
// @route   POST /api/posts/:id/comments
// @desc    Adicionar um comentário a um post
// @access  Público (geralmente comentários não exigem autenticação)
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

        // Adiciona o novo comentário ao array 'comments' do post
        post.comments.push(newComment);
        await post.save(); // Salva o post atualizado no banco de dados

        // Retorna o comentário recém-adicionado
        // Você pode retornar o post completo, o comentário adicionado, ou uma mensagem de sucesso
        res.status(201).json(newComment); // Retorna o comentário recém-criado
    } catch (err) {
        console.error(err.message);
        // Lidar com IDs mal formatados
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido para adicionar comentário.' });
        }
        res.status(500).send('Erro no Servidor ao adicionar comentário.');
    }
});

// NOVO: Rota para obter os comentários de um post específico
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

        // Retorna apenas os comentários do post
        // Você pode querer ordenar os comentários aqui, se não estiverem ordenados no modelo
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
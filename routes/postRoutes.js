const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Certifique-se de que o caminho para seu modelo Post está correto
const auth = require('../middleware/authMiddleware'); // NOVO: Importa o middleware de autenticação

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

// @route   GET /api/posts/:id // MUDANÇA AQUI: de :slug para :id
// @desc    Obter um post específico pelo ID // MUDANÇA AQUI: de SLUG para ID
// @access  Público (não precisa de autenticação)
// ATENÇÃO: Se você usa ID aqui, o frontend deve enviar o ID do MongoDB.
router.get('/:id', async (req, res) => { // MUDANÇA AQUI: de :slug para :id
    try {
        const postId = req.params.id; // MUDANÇA AQUI: Pega o ID da URL

        // MUDANÇA AQUI: Altera de findOne para findById para buscar pelo ID
        const post = await Post.findById(postId); // Busca pelo ID

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        // MUDANÇA AQUI: Tratamento de erro para ID inválido do MongoDB
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
    // AQUI: Mude de 'thumbnailUrl' para 'thumbnail'
    const { title, slug, summary, content, thumbnail, author } = req.body; // Alterado para 'thumbnail'

    try {
        const newPost = new Post({
            title,
            slug,
            summary,
            content,
            thumbnail, // AQUI: Atribuindo 'thumbnail' ao campo 'thumbnail' do modelo
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

// @route   PUT /api/posts/:id // MUDANÇA AQUI: de :slug para :id
// @desc    Atualizar um post existente
// @access  Privado (requer autenticação de admin/editor)
router.put('/:id', auth, async (req, res) => { // MUDANÇA AQUI: de :slug para :id
    // AQUI: Mude de 'thumbnailUrl' para 'thumbnail'
    const { title, slug, summary, content, thumbnail, author } = req.body; // Alterado para 'thumbnail', slug pode ser atualizável aqui se necessário

    const postFields = {};
    if (title) postFields.title = title;
    // Se o slug pode ser editado mas o ID é o identificador, mantenha-o aqui:
    if (slug) postFields.slug = slug;
    if (summary) postFields.summary = summary;
    if (content) postFields.content = content;

    // AQUI: Atribua o valor recebido ('thumbnail') ao campo 'thumbnail' do modelo
    if (thumbnail !== undefined) { // Permite que a thumbnail seja salva como string vazia se o campo for limpo
        postFields.thumbnail = thumbnail;
    }
    if (author) postFields.author = author;
    postFields.updatedAt = Date.now(); // Atualiza a data de modificação

    try {
        // MUDANÇA AQUI: Encontre o post pelo ID, não pelo slug
        let post = await Post.findById(req.params.id); // Busca pelo ID

        if (!post) return res.status(404).json({ msg: 'Post não encontrado' });

        // MUDANÇA AQUI: De findOneAndUpdate para findByIdAndUpdate
        post = await Post.findByIdAndUpdate( // Critério de busca pelo ID
            req.params.id, // MUDANÇA AQUI: Usa req.params.id
            { $set: postFields },
            { new: true }
        );

        res.json(post);
    } catch (err) {
        console.error(err.message);
        // MUDANÇA AQUI: Tratamento de erro para ID inválido
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido.' });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            return res.status(400).json({ msg: 'O slug já existe. Escolha outro.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE /api/posts/:id // MUDANÇA AQUI: de :slug para :id
// @desc    Deletar um post
// @access  Privado (requer autenticação de admin/editor)
router.delete('/:id', auth, async (req, res) => { // MUDANÇA AQUI: de :slug para :id
    try {
        // MUDANÇA AQUI: De findOneAndDelete para findByIdAndDelete
        const post = await Post.findByIdAndDelete(req.params.id); // Busca e deleta pelo ID

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        res.json({ msg: 'Post removido com sucesso' });
    } catch (err) {
        console.error(err.message);
        // MUDANÇA AQUI: Tratamento de erro para ID inválido
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'ID do post inválido.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});


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
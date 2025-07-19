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

// @route   GET /api/posts/:slug (Melhor usar slug para URLs públicas amigáveis)
// @desc    Obter um post específico pelo SLUG
// @access  Público (não precisa de autenticação)
// ATENÇÃO: Se você usa slug aqui, o frontend deve enviar o slug, não o ID do MongoDB.
// Seu admin.js já está usando slug para edição, então isso é mais consistente.
router.get('/:slug', async (req, res) => { // Mudança de :id para :slug
    try {
        const postSlug = req.params.slug; // Pega o slug da URL

        // Altera de findById para findOne para buscar pelo slug
        const post = await Post.findOne({ slug: postSlug }); // Busca pelo slug

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        // Se houver um erro, é um erro de servidor, não de CastError para slug.
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

// @route   PUT /api/posts/:slug (Usando slug para consistência com o GET e admin.js)
// @desc    Atualizar um post existente
// @access  Privado (requer autenticação de admin/editor)
router.put('/:slug', auth, async (req, res) => { // Mudança de :id para :slug
    // AQUI: Mude de 'thumbnailUrl' para 'thumbnail'
    const { title, summary, content, thumbnail, author } = req.body; // Alterado para 'thumbnail', slug não é atualizável aqui

    const postFields = {};
    if (title) postFields.title = title;
    // O slug não deve ser atualizado via PUT, pois ele é a chave de identificação na URL
    if (summary) postFields.summary = summary;
    if (content) postFields.content = content;

    // AQUI: Atribua o valor recebido ('thumbnail') ao campo 'thumbnail' do modelo
    if (thumbnail !== undefined) { // Permite que a thumbnail seja salva como string vazia se o campo for limpo
        postFields.thumbnail = thumbnail;
    }
    if (author) postFields.author = author;
    postFields.updatedAt = Date.now(); // Atualiza a data de modificação

    try {
        // Encontre o post pelo slug, não pelo ID
        let post = await Post.findOne({ slug: req.params.slug }); // Busca pelo slug

        if (!post) return res.status(404).json({ msg: 'Post não encontrado' });

        // Se o slug foi alterado no req.body (e você permitisse, o que não recomendo),
        // precisaria de uma validação extra para duplicidade.
        // Como o slug é a chave da URL, é melhor mantê-lo imutável na atualização.

        post = await Post.findOneAndUpdate( // Mudança de findByIdAndUpdate para findOneAndUpdate
            { slug: req.params.slug }, // Critério de busca pelo slug
            { $set: postFields },
            { new: true }
        );

        res.json(post);
    } catch (err) {
        console.error(err.message);
        // Não haverá 'err.kind === 'ObjectId'' para slug.
        if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            return res.status(400).json({ msg: 'O slug já existe. Escolha outro.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE /api/posts/:slug (Usando slug para consistência)
// @desc    Deletar um post
// @access  Privado (requer autenticação de admin/editor)
router.delete('/:slug', auth, async (req, res) => { // Mudança de :id para :slug
    try {
        const post = await Post.findOneAndDelete({ slug: req.params.slug }); // Busca e deleta pelo slug

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        res.json({ msg: 'Post removido com sucesso' });
    } catch (err) {
        console.error(err.message);
        // Não haverá 'err.kind === 'ObjectId'' para slug.
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
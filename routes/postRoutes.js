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

// @route   GET /api/posts/:slug (ou :id, dependendo de como você busca um único post)
// @desc    Obter um post específico pelo slug ou ID
// @access  Público (não precisa de autenticação)
router.get('/:id', async (req, res) => { // Mude :slug para :id aqui
    try {
        const postId = req.params.id; // Captura o ID da URL

        // Altere para Post.findById(postId) para buscar por ID do MongoDB
        const post = await Post.findById(postId); // <-- MUDANÇA AQUI

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        // Esta verificação é importante para lidar com IDs mal formatados
        if (err.name === 'CastError') { // Verifica se o erro é de formatação inválida do ID
            return res.status(400).json({ msg: 'ID do post inválido.' }); // Retorna 400 para ID inválido
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   POST /api/posts
// @desc    Criar um novo post
// @access  Privado (requer autenticação de admin/editor)
router.post('/', auth, async (req, res) => { // Adiciona o middleware 'auth' aqui
    // Você pode adicionar uma verificação de role se quiser que apenas 'admin' crie
    // if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    //     return res.status(403).json({ msg: 'Não autorizado' });
    // }

    const { title, slug, summary, content, thumbnailUrl, author } = req.body;

    try {
        const newPost = new Post({
            title,
            slug,
            summary,
            content,
            thumbnailUrl,
            author,
            // Adicione o userId se quiser vincular o post ao usuário que o criou
            // user: req.user.id
        });

        const post = await newPost.save();
        res.status(201).json(post); // 201 Created
    } catch (err) {
        console.error(err.message);
        // Erro de validação ou slug duplicado
        if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            return res.status(400).json({ msg: 'O slug já existe. Escolha outro.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   PUT /api/posts/:id
// @desc    Atualizar um post existente
// @access  Privado (requer autenticação de admin/editor)
router.put('/:id', auth, async (req, res) => { // Adiciona o middleware 'auth' aqui
    // Você pode adicionar verificação de role e/ou se o usuário é o autor do post
    // if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    //     return res.status(403).json({ msg: 'Não autorizado' });
    // }

    const { title, slug, summary, content, thumbnailUrl, author } = req.body;

    // Constrói o objeto de campos do post
    const postFields = {};
    if (title) postFields.title = title;
    if (slug) postFields.slug = slug;
    if (summary) postFields.summary = summary;
    if (content) postFields.content = content;
    if (thumbnailUrl) postFields.thumbnailUrl = thumbnailUrl;
    if (author) postFields.author = author;
    postFields.updatedAt = Date.now(); // Atualiza a data de modificação

    try {
        let post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ msg: 'Post não encontrado' });

        // Opcional: Verificar se o usuário que está editando é o autor ou um admin
        // if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        //     return res.status(401).json({ msg: 'Não autorizado a editar este post' });
        // }

        post = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: postFields },
            { new: true } // Retorna o documento atualizado
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
router.delete('/:id', auth, async (req, res) => { // Adiciona o middleware 'auth' aqui
    // Você pode adicionar verificação de role e/ou se o usuário é o autor do post
    // if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    //     return res.status(403).json({ msg: 'Não autorizado' });
    // }

    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        // Opcional: Verificar se o usuário que está deletando é o autor ou um admin
        // if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        //     return res.status(401).json({ msg: 'Não autorizado a deletar este post' });
        // }

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

module.exports = router;
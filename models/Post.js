// portfolio-blog-backend/models/Post.js

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true // Remove espaços em branco do início/fim
    },
    slug: { // URL amigável (ex: "como-criar-um-blog")
        type: String,
        required: true,
        unique: true, // Garante que cada slug é único
        lowercase: true // Converte para minúsculas
    },
    summary: { // Pequeno resumo para a lista de posts
        type: String,
        required: true,
        trim: true
    },
    content: { // Conteúdo completo do post
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Seu Nome' // Pode ser seu nome padrão
    },
    thumbnail: { // URL da imagem de capa/thumbnail
        type: String,
        default: '' // Pode ser opcional ou ter uma imagem padrão
    },
    tags: [String], // Array de strings para tags (ex: ['react', 'node', 'frontend'])
    category: { // Categoria do post (ex: 'desenvolvimento', 'carreira')
        type: String,
        required: true,
        enum: ['Frontend', 'Backend', 'DevOps', 'Carreira', 'Outros'] // Categorias permitidas
    },
    likes: { // Contador de curtidas
        type: Number,
        default: 0
    },
    views: { // Contador de visualizações (opcional)
        type: Number,
        default: 0
    },
    publishedAt: { // Data de publicação
        type: Date,
        default: Date.now // Define a data atual como padrão ao criar
    },
    updatedAt: { // Data da última atualização
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adiciona automaticamente createdAt e updatedAt (createdAt e updatedAt)
});

// Middleware para atualizar o 'updatedAt' sempre que o post for salvo
postSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Post', postSchema);
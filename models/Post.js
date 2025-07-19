// portfolio-blog-backend/models/Post.js

const mongoose = require('mongoose');

// 1. Defina o esquema para os comentários primeiro
const CommentSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    publishedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // Comentários não precisam de seus próprios createdAt/updatedAt se você gerenciar 'publishedAt'
});


const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    summary: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Seu Nome'
    },
    thumbnail: {
        type: String,
        default: ''
    },
    tags: [String],
    category: {
        type: String,
        required: true,
        enum: ['Frontend', 'Backend', 'DevOps', 'Carreira', 'Outros']
    },
    likes: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // 2. ADICIONE A PROPRIEDADE 'comments' QUE É UM ARRAY DO CommentSchema
    comments: [CommentSchema] // <--- ADIÇÃO ESSENCIAL AQUI!
}, {
    timestamps: true // Adiciona automaticamente createdAt e updatedAt (para o Post principal)
});

// Middleware para atualizar o 'updatedAt' sempre que o post for salvo
postSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Post', postSchema);
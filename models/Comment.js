// portfolio-blog-backend/models/Comment.js

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId, // Referência ao ID do post
        ref: 'Post', // Refere-se ao modelo 'Post'
        required: true
    },
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
        default: Date.now // Define a data atual como padrão
    }
});

module.exports = mongoose.model('Comment', CommentSchema);
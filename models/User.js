const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Importa o bcryptjs

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Garante que cada username seja único
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: { // Para diferenciar tipos de usuários (admin, editor, etc.)
        type: String,
        enum: ['admin', 'editor', 'user'], // Exemplo de roles
        default: 'editor' // Por padrão, pode ser um editor ou o que preferir
    }
}, {
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Pré-salvamento: Hash da senha antes de salvar o usuário
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { // Só faz o hash se a senha foi modificada (ou é nova)
        return next();
    }
    const salt = await bcrypt.genSalt(10); // Gera um salt (valor aleatório)
    this.password = await bcrypt.hash(this.password, salt); // Faz o hash da senha
    next();
});

// Método para comparar a senha fornecida com a senha hash no banco de dados
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name is required !"],
    },
    email: {
        type: String,
        required: [true, "email is required !"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "password is required"],
    }
}, {
    timestamps: true
})


const User = mongoose.model('User', userSchema);

userSchema.pre('save', async function(next) {
    this.password = await bcrypt.hash( this.password,10);
    next();
});

module.exports = User;
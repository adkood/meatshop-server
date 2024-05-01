const mongoose = require('mongoose');

const meatSchema = new mongoose.Schema({
    meatType: {
        type: String,
        required: true,
        maxLength: 255
    },
    pricePerKg: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

const Meat = mongoose.model('Meat', meatSchema);

module.exports = Meat;

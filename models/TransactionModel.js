const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    outletId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    consumerName: {
        type: String,
        required: true,
    },
    consumerNumber: {
        type: String,
        required: true,
    },
    items: [
        {
            meatId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Meat',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    addedOn: {
        type: Date,
        required: true,
        default: Date.now()
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

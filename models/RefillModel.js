const mongoose = require('mongoose');

const refillHistorySchema = new mongoose.Schema({
    outletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outlet',
        required: true
    },
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },
    meatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meat',
        required: true
    },
    refillQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    refillDate: {
        type: Date,
        required: true,
    }
},{
    timestamps: true
});

const Refill = mongoose.model('Refill', refillHistorySchema);

module.exports = Refill;

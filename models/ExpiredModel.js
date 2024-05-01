const mongoose = require('mongoose');

const expiredItemSchema = new mongoose.Schema({
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
    quantityExpired: {
        type: Number,
        required: true,
        min: 0
    },
    addedOn: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

const Expired = mongoose.model('Expired', expiredItemSchema);

module.exports = Expired;

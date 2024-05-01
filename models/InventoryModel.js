const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    meatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meat',
        required: true
    },
    outletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outlet',
        required: true
    },
    stockLevel: {
        type: Number,
        required: true,
        min: 0
    },
    storageConditions: String,
    meats: [
        {
            quantityAvailable: {
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
        }
    ]
}, {
    timestamps: true
});


const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;

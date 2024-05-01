const mongoose = require('mongoose');

const outletSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
        maxLength: 255
    }
},{
    timestamps: true
});

const Outlet = mongoose.model('Outlet', outletSchema);

module.exports = Outlet;

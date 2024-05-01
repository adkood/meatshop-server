const ExpiredItem = require('../models/ExpiredModel');

exports.getExpiredItems = async (req, res) => {
    try {
        const expiredItems = await ExpiredItem.find().populate('meatId').populate('outletId');
        res.status(200).json({
            status: "success", 
            items: expiredItems.length,
            data: {
                expiredItems
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error",
            message: error.message 
        });
    }
};
const Inventory = require('../models/InventoryModel');
const Expired = require('../models/ExpiredModel');
const Refill = require('../models/RefillModel');

exports.createInventory = async (req, res) => {
    try {
        const inventory = new Inventory(req.body);
        await inventory.save();
        res.status(201).json({
            status: "success",
            data: {
                inventory
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

exports.getInventory = async (req, res) => {
    const { outletId, meatId } = req.query;
    const query = {};

    if (outletId) {
        query.outletId = outletId;
    }

    if (meatId) {
        query.meatId = meatId;
    }

    try {
        const inventories = await Inventory.find(query).populate('meatId').populate('outletId');
        res.status(200).json({
            status: "success",
            items: inventories.length,
            data: {
                inventories
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

exports.addMeatToInventory = async (req, res) => {
    try {
        const { inventoryId, outletId, quantityAvailable, expiryDate } = req.body;

        if (!inventoryId || !outletId || !quantityAvailable || !expiryDate) {
            return res.status(400).json({ status: "error", message: 'All fields are required. Cannot add to inventory.' });
        }

        const inventory = await Inventory.findOne({ _id: inventoryId, outletId });

        if (!inventory) {
            return res.status(404).json({ status: "error", message: 'Inventory not found for the specified outlet.' });
        }

        // pushing on meat array
        const addedOn = new Date();
        inventory.meats.push({
            quantityAvailable,
            addedOn,
            expiryDate
        });
        inventory.stockLevel += quantityAvailable;

        //adding document to refill collections
        const refilled = new Refill({
            outletId,
            inventoryId,
            meatId: inventory.meatId,
            refillQuantity: quantityAvailable,
            refillDate: addedOn,
        });
        await refilled.save();

        // saving inventory document
        await inventory.save();
        res.status(200).json({
            status: "success",
            message: 'Meat added to inventory successfully.',
            data: {
                inventory
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: 'Internal server error.'
        });
    }
};

exports.removeExpiredItems = async (req, res) => {
    try {
        const { inventoryId } = req.body;

        if (!inventoryId) {
            return res.status(400).json({
                status: "error",
                message: 'Inventory ID is required.'
            });
        }

        const inventory = await Inventory.findById(inventoryId);

        if (!inventory) {
            return res.status(404).json({
                status: "error",
                message: 'Inventory not found.'
            });
        }

        //adding document to expired collections
        const currentDate = new Date();
        const expiredItems = inventory.meats.filter(meat => meat.expiryDate <= currentDate);

        for (const item of expiredItems) {
            const expiredItem = new Expired({
                outletId: inventory.outletId,
                inventoryId: inventoryId,
                meatId: inventory.meatId,
                quantityExpired: item.quantityAvailable,
                addedOn: item.addedOn,
                expiryDate: item.expiryDate
            });
            await expiredItem.save();
        }

        // removing expired meats form the meat array
        inventory.meats = inventory.meats.filter(meat => meat.expiryDate > currentDate);

        inventory.stockLevel = inventory.meats.reduce((total, meat) => total + meat.quantityAvailable, 0);

        await inventory.save();

        res.status(200).json({
            status: 'success',
            data: {
                inventory
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: 'Internal server error.'
        });
    }
};

exports.checkRefillStatus = async (req, res) => {
    try {
        const { inventoryId } = req.params;

        if (!inventoryId) {
            return res.status(400).json({ message: 'Inventory ID is required.' });
        }

        const inventory = await Inventory.findById(inventoryId);

        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found.' });
        }

        // Check refill status
        if (inventory.stockLevel <= 20) {
            return res.status(200).json({
                status: "success",
                message: 'Refill is needed.',
                data: {
                    inventory
                }
            });
        } else {
            return res.status(200).json({
                status: "success",
                message: 'No Refill is needed at the moment.',
                data: {
                    inventory
                }
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: 'Internal server error.'
        });
    }
};

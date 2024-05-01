const express = require('express');
const InventoryController = require('../controllers/InventoryController');

const Router = express.Router();

Router.post('/inventory', InventoryController.createInventory);
Router.get('/inventory', InventoryController.getInventory);
Router.patch('/inventory/add-meat', InventoryController.addMeatToInventory);
Router.patch('/inventory/remove-expired-items', InventoryController.removeExpiredItems);
Router.get('/inventory/check-refill-status/:inventoryId', InventoryController.checkRefillStatus);

module.exports = Router;
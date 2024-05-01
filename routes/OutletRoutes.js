const express = require('express');
const OutletController = require('../controllers/OutletController')
const Router = express.Router();

Router.post('/outlets', OutletController.createOutlet);
Router.get('/outlets', OutletController.getOutlets);

module.exports = Router;
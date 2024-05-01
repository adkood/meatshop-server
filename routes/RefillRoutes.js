const express = require("express");
const refillController = require('../controllers/RefillController');
const Router = express.Router();

Router.get('/refills', refillController.getRefills);

module.exports = Router;
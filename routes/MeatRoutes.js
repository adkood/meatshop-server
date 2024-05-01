const express = require('express');
const MeatController = require('../controllers/MeatController');

const Router = express.Router();

Router.post('/meats', MeatController.createMeat);
Router.get('/meats', MeatController.getMeats);

module.exports = Router;